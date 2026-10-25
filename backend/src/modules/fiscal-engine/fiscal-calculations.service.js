const { AppError } = require('../../middlewares/error.middleware');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const fiscalCalculationsRepository = require('../../db/supabase/repositories/fiscal-calculations.repository');
const {
  listRulePacks: listVatRulePacks,
  simulateVat,
  DEFAULT_VERSION: VAT_DEFAULT_VERSION,
} = require('./vat-engine');
const {
  listRulePacks: listIrsRulePacks,
  simulateIrsBrackets,
  DEFAULT_VERSION: IRS_DEFAULT_VERSION,
} = require('./irs-engine');
const {
  listRulePacks: listSsRulePacks,
  simulateSs,
  DEFAULT_VERSION: SS_DEFAULT_VERSION,
} = require('./ss-engine');
const {
  listRulePacks: listWhRulePacks,
  simulateWithholding,
  DEFAULT_VERSION: WH_DEFAULT_VERSION,
} = require('./withholding-engine');
const {
  listRulePacks: listImtRulePacks,
  simulateImt,
  DEFAULT_VERSION: IMT_DEFAULT_VERSION,
} = require('./imt-engine');

function toAppError(err) {
  if (err?.code === 'INVALID_AMOUNT' || err?.code === 'INVALID_RATE') {
    return new AppError(err.message, 400, err.code);
  }
  if (err?.code === 'UNKNOWN_RULE_VERSION' || err?.code === 'UNKNOWN_RATE') {
    return new AppError(err.message, 400, err.code);
  }
  return err;
}

function getVatCatalog() {
  return {
    defaultVersion: VAT_DEFAULT_VERSION,
    packs: listVatRulePacks(),
    disclaimer:
      'Simulações de apoio ao trabalho do escritório. Não substituem software certificado nem declarações à AT.',
  };
}

function getIrsCatalog() {
  return {
    defaultVersion: IRS_DEFAULT_VERSION,
    packs: listIrsRulePacks(),
    disclaimer:
      'Simulações de coleta sobre rendimento coletável (escalões gerais, continente). Não substituem a declaração de IRS nem o Portal das Finanças.',
  };
}

function getSsCatalog() {
  return {
    defaultVersion: SS_DEFAULT_VERSION,
    packs: listSsRulePacks(),
    disclaimer:
      'Simulações de contribuições para a Segurança Social. Não substituem a Segurança Social Direta nem declarações oficiais.',
  };
}

function getWithholdingCatalog() {
  return {
    defaultVersion: WH_DEFAULT_VERSION,
    packs: listWhRulePacks(),
    disclaimer:
      'Simulações de retenção na fonte (continente, tabelas I–III). Não substituem recibo de vencimento oficial nem o Portal das Finanças.',
  };
}

function getImtCatalog() {
  return {
    defaultVersion: IMT_DEFAULT_VERSION,
    packs: listImtRulePacks(),
    disclaimer:
      'Simulações de IMT (continente). Não substituem a liquidação oficial nem o Portal das Finanças.',
  };
}

function runSimulate(body) {
  try {
    return simulateVat({
      direction: body.direction,
      amountCents: body.amountCents,
      rateCode: body.rateCode,
      ruleVersion: body.ruleVersion || VAT_DEFAULT_VERSION,
    });
  } catch (err) {
    throw toAppError(err);
  }
}

function runIrsSimulate(body) {
  try {
    return simulateIrsBrackets({
      taxableIncomeCents: body.taxableIncomeCents,
      filingStatus: body.filingStatus,
      includeSolidarity: body.includeSolidarity,
      ruleVersion: body.ruleVersion || IRS_DEFAULT_VERSION,
    });
  } catch (err) {
    throw toAppError(err);
  }
}

function runSsSimulate(body) {
  try {
    return simulateSs({
      regimeCode: body.regimeCode,
      baseCents: body.baseCents,
      servicesCents: body.servicesCents,
      ruleVersion: body.ruleVersion || SS_DEFAULT_VERSION,
    });
  } catch (err) {
    throw toAppError(err);
  }
}

function runWithholdingSimulate(body) {
  try {
    return simulateWithholding({
      tableCode: body.tableCode,
      remunerationCents: body.remunerationCents,
      dependents: body.dependents,
      ruleVersion: body.ruleVersion || WH_DEFAULT_VERSION,
    });
  } catch (err) {
    throw toAppError(err);
  }
}

function runImtSimulate(body) {
  try {
    return simulateImt({
      tableCode: body.tableCode,
      flatRateCode: body.flatRateCode,
      taxableValueCents: body.taxableValueCents,
      ruleVersion: body.ruleVersion || IMT_DEFAULT_VERSION,
    });
  } catch (err) {
    throw toAppError(err);
  }
}

async function persistSimulation({ firmId, actorId, body, simulation, metaExtra }) {
  let clientId = body.clientId || null;
  if (clientId) {
    const client = await clientsRepository.findClientById(firmId, clientId);
    if (!client) throw new AppError('Cliente não encontrado', 404, 'CLIENT_NOT_FOUND');
  }

  const status = body.status === 'draft' ? 'draft' : 'simulation';

  const row = await fiscalCalculationsRepository.insertCalculation({
    firmId,
    clientId,
    calcType: simulation.calcType,
    jurisdiction: simulation.jurisdiction,
    tax: simulation.tax,
    ruleVersion: simulation.ruleVersion,
    status,
    input: simulation.input,
    result: simulation.result,
    meta: {
      source: simulation.source,
      rounding: simulation.rounding,
      limitations: simulation.limitations,
      disclaimer: simulation.disclaimer,
      ...metaExtra,
    },
    createdBy: actorId || null,
  });

  return { calculation: row, simulation };
}

async function createVatSimulation({ firmId, actorId, body }) {
  const simulation = runSimulate(body);
  return persistSimulation({
    firmId,
    actorId,
    body,
    simulation,
    metaExtra: { rate: simulation.rate },
  });
}

async function createIrsSimulation({ firmId, actorId, body }) {
  const simulation = runIrsSimulate(body);
  return persistSimulation({ firmId, actorId, body, simulation, metaExtra: {} });
}

async function createSsSimulation({ firmId, actorId, body }) {
  const simulation = runSsSimulate(body);
  return persistSimulation({
    firmId,
    actorId,
    body,
    simulation,
    metaExtra: { regime: simulation.regime },
  });
}

async function createWithholdingSimulation({ firmId, actorId, body }) {
  const simulation = runWithholdingSimulate(body);
  return persistSimulation({
    firmId,
    actorId,
    body,
    simulation,
    metaExtra: { table: simulation.table },
  });
}

async function createImtSimulation({ firmId, actorId, body }) {
  const simulation = runImtSimulate(body);
  return persistSimulation({
    firmId,
    actorId,
    body,
    simulation,
    metaExtra: { regime: simulation.regime },
  });
}

async function listCalculations({ firmId, limit, calcType }) {
  const items = await fiscalCalculationsRepository.listForFirm(firmId, { limit, calcType });
  return { items };
}

async function getCalculation({ firmId, id }) {
  const row = await fiscalCalculationsRepository.findById(firmId, id);
  if (!row) throw new AppError('Cálculo não encontrado', 404, 'CALCULATION_NOT_FOUND');
  return { calculation: row };
}

module.exports = {
  getVatCatalog,
  getIrsCatalog,
  getSsCatalog,
  getWithholdingCatalog,
  getImtCatalog,
  runSimulate,
  runIrsSimulate,
  runSsSimulate,
  runWithholdingSimulate,
  runImtSimulate,
  createVatSimulation,
  createIrsSimulation,
  createSsSimulation,
  createWithholdingSimulation,
  createImtSimulation,
  listCalculations,
  getCalculation,
};
