const ptSs2026 = require('./rules/pt-ss-2026');
const { contributionFromBase, relevantIncomeFromGross } = require('./ss-math');

const RULE_PACKS = Object.freeze({
  [ptSs2026.version]: ptSs2026,
});

const DEFAULT_VERSION = ptSs2026.version;

function listRulePacks() {
  return Object.values(RULE_PACKS).map((r) => ({
    version: r.version,
    jurisdiction: r.jurisdiction,
    tax: r.tax,
    status: r.status,
    effectiveFrom: r.effectiveFrom,
    effectiveTo: r.effectiveTo,
    source: r.source,
    rounding: r.rounding,
    iasCents: r.iasCents,
    regimes: r.regimes,
    limitations: r.limitations,
  }));
}

function getRulePack(version) {
  const pack = RULE_PACKS[version || DEFAULT_VERSION];
  if (!pack) {
    const err = new Error('Versão de regras SS desconhecida');
    err.code = 'UNKNOWN_RULE_VERSION';
    throw err;
  }
  return pack;
}

function resolveRegime(pack, regimeCode) {
  const regime = pack.regimes.find((r) => r.code === regimeCode);
  if (!regime) {
    const err = new Error('Regime contributivo desconhecido nesta versão');
    err.code = 'UNKNOWN_RATE';
    throw err;
  }
  return regime;
}

function hasGrossInput(input) {
  const hasServices = input.servicesCents != null && input.servicesCents !== '';
  const hasSales = input.salesCents != null && input.salesCents !== '';
  return hasServices || hasSales;
}

/**
 * @param {{
 *   regimeCode: string,
 *   baseCents?: number,
 *   servicesCents?: number,
 *   salesCents?: number,
 *   ruleVersion?: string,
 * }} input
 *
 * Para TCO: baseCents = remuneração ilíquida.
 * Para TI: baseCents = base de incidência já conhecida, OU
 *   servicesCents (70 %) e/ou salesCents (20 %) para estimar rendimento relevante.
 */
function simulateSs(input) {
  const pack = getRulePack(input.ruleVersion);
  const regime = resolveRegime(pack, input.regimeCode);

  let baseCents;
  let derivedFrom = null;
  let servicesCents = null;
  let salesCents = null;
  let relevantIncomeCents = null;
  let relevantFromServicesCents = null;
  let relevantFromSalesCents = null;
  const servicesPct = regime.relevantIncomePct ?? 70;
  const salesPct = regime.relevantIncomeSalesPct ?? 20;

  if (hasGrossInput(input)) {
    if (regime.kind !== 'self_employed') {
      const err = new Error(
        'Prestação de serviços / vendas só se aplicam a regimes de trabalhador independente',
      );
      err.code = 'INVALID_AMOUNT';
      throw err;
    }

    const rawServices =
      input.servicesCents != null && input.servicesCents !== ''
        ? Math.round(Number(input.servicesCents))
        : 0;
    const rawSales =
      input.salesCents != null && input.salesCents !== ''
        ? Math.round(Number(input.salesCents))
        : 0;

    if (!Number.isFinite(rawServices) || rawServices < 0) {
      const err = new Error('Prestação de serviços inválida');
      err.code = 'INVALID_AMOUNT';
      throw err;
    }
    if (!Number.isFinite(rawSales) || rawSales < 0) {
      const err = new Error('Vendas inválidas');
      err.code = 'INVALID_AMOUNT';
      throw err;
    }
    if (rawServices === 0 && rawSales === 0) {
      const err = new Error('Indique prestação de serviços e/ou vendas');
      err.code = 'INVALID_AMOUNT';
      throw err;
    }

    servicesCents = rawServices > 0 ? rawServices : null;
    salesCents = rawSales > 0 ? rawSales : null;
    relevantFromServicesCents =
      rawServices > 0 ? relevantIncomeFromGross(rawServices, servicesPct, 'Prestação de serviços') : 0;
    relevantFromSalesCents =
      rawSales > 0 ? relevantIncomeFromGross(rawSales, salesPct, 'Vendas') : 0;
    relevantIncomeCents = relevantFromServicesCents + relevantFromSalesCents;
    baseCents = relevantIncomeCents;
    derivedFrom = 'gross_relevant_income';
  } else {
    baseCents = Math.round(Number(input.baseCents));
    derivedFrom = 'base_direct';
  }

  if (!Number.isFinite(baseCents) || baseCents < 0) {
    const err = new Error('Base de incidência inválida');
    err.code = 'INVALID_AMOUNT';
    throw err;
  }

  const workerCents = contributionFromBase(baseCents, regime.workerBps);
  const employerCents = contributionFromBase(baseCents, regime.employerBps);
  const totalCents = workerCents + employerCents;

  return {
    calcType: 'ss_contributions',
    jurisdiction: pack.jurisdiction,
    tax: pack.tax,
    ruleVersion: pack.version,
    ruleStatus: pack.status,
    source: pack.source,
    rounding: pack.rounding,
    limitations: pack.limitations,
    regime: {
      code: regime.code,
      label: regime.label,
      kind: regime.kind,
      workerBps: regime.workerBps,
      employerBps: regime.employerBps,
      totalBps: regime.totalBps,
      workerPercent: regime.workerBps / 100,
      employerPercent: regime.employerBps / 100,
      totalPercent: regime.totalBps / 100,
      relevantIncomePct: regime.kind === 'self_employed' ? servicesPct : null,
      relevantIncomeSalesPct: regime.kind === 'self_employed' ? salesPct : null,
    },
    input: {
      regimeCode: regime.code,
      baseCents,
      servicesCents,
      salesCents,
      derivedFrom,
      relevantIncomePct: derivedFrom === 'gross_relevant_income' ? servicesPct : null,
      relevantIncomeSalesPct: derivedFrom === 'gross_relevant_income' ? salesPct : null,
    },
    result: {
      baseCents,
      relevantIncomeCents,
      relevantFromServicesCents:
        derivedFrom === 'gross_relevant_income' ? relevantFromServicesCents : null,
      relevantFromSalesCents:
        derivedFrom === 'gross_relevant_income' ? relevantFromSalesCents : null,
      workerCents,
      employerCents,
      totalCents,
    },
    disclaimer:
      'Simulação de contribuições para a Segurança Social. Não é declaração oficial. Confirme o enquadramento e a base de incidência na Segurança Social Direta.',
  };
}

module.exports = {
  DEFAULT_VERSION,
  listRulePacks,
  getRulePack,
  simulateSs,
};
