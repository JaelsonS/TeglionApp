const ptSs2026 = require('./rules/pt-ss-2026');
const { contributionFromBase, relevantIncomeFromServices } = require('./ss-math');

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

/**
 * @param {{
 *   regimeCode: string,
 *   baseCents?: number,
 *   servicesCents?: number,
 *   ruleVersion?: string,
 * }} input
 *
 * Para TCO: baseCents = remuneração ilíquida.
 * Para TI: baseCents = base de incidência já conhecida, OU servicesCents
 *   (estima rendimento relevante a 70 % e usa como base).
 */
function simulateSs(input) {
  const pack = getRulePack(input.ruleVersion);
  const regime = resolveRegime(pack, input.regimeCode);

  let baseCents;
  let derivedFrom = null;
  let servicesCents = null;
  let relevantIncomeCents = null;

  if (input.servicesCents != null && input.servicesCents !== '') {
    if (regime.kind !== 'self_employed') {
      const err = new Error('Prestação de serviços só se aplica a regimes de trabalhador independente');
      err.code = 'INVALID_AMOUNT';
      throw err;
    }
    servicesCents = Math.round(Number(input.servicesCents));
    const pct = regime.relevantIncomePct ?? 70;
    relevantIncomeCents = relevantIncomeFromServices(servicesCents, pct);
    baseCents = relevantIncomeCents;
    derivedFrom = 'services_relevant_income';
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
    },
    input: {
      regimeCode: regime.code,
      baseCents,
      servicesCents,
      derivedFrom,
      relevantIncomePct: derivedFrom === 'services_relevant_income' ? regime.relevantIncomePct ?? 70 : null,
    },
    result: {
      baseCents,
      relevantIncomeCents,
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
