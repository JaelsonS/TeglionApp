const { AppError } = require('../../middlewares/error.middleware');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const fiscalCalculationsRepository = require('../../db/supabase/repositories/fiscal-calculations.repository');
const { listRulePacks, simulateVat, DEFAULT_VERSION } = require('./vat-engine');

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
    defaultVersion: DEFAULT_VERSION,
    packs: listRulePacks(),
    disclaimer:
      'Simulações de apoio ao trabalho do escritório. Não substituem software certificado nem declarações à AT.',
  };
}

function runSimulate(body) {
  try {
    return simulateVat({
      direction: body.direction,
      amountCents: body.amountCents,
      rateCode: body.rateCode,
      ruleVersion: body.ruleVersion || DEFAULT_VERSION,
    });
  } catch (err) {
    throw toAppError(err);
  }
}

async function createVatSimulation({ firmId, actorId, body }) {
  const simulation = runSimulate(body);

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
      rate: simulation.rate,
      source: simulation.source,
      rounding: simulation.rounding,
      limitations: simulation.limitations,
      disclaimer: simulation.disclaimer,
    },
    createdBy: actorId || null,
  });

  return { calculation: row, simulation };
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
  runSimulate,
  createVatSimulation,
  listCalculations,
  getCalculation,
};
