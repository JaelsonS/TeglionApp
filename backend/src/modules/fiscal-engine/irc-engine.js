const packRules = require('./rules/pt-irc-2026');
const {
  taxFromProgressiveBrackets,
  stateSurchargeFromBands,
  municipalSurcharge,
} = require('./irc-math');

const RULE_PACKS = Object.freeze({
  [packRules.version]: packRules,
});

const DEFAULT_VERSION = packRules.version;

function listRulePacks() {
  return Object.values(RULE_PACKS).map((r) => ({
    version: r.version,
    jurisdiction: r.jurisdiction,
    tax: r.tax,
    status: r.status,
    effectiveFrom: r.effectiveFrom,
    effectiveTo: r.effectiveTo,
    territory: r.territory,
    source: r.source,
    rounding: r.rounding,
    limitations: r.limitations,
    regimes: Object.values(r.regimes).map((reg) => ({
      code: reg.code,
      label: reg.label,
      brackets: reg.brackets,
    })),
    stateSurcharge: r.stateSurcharge,
    municipalDerramaMaxBps: r.municipalDerramaMaxBps,
  }));
}

function getRulePack(version) {
  const pack = RULE_PACKS[version || DEFAULT_VERSION];
  if (!pack) {
    const err = new Error('Versão de regras IRC desconhecida');
    err.code = 'UNKNOWN_RULE_VERSION';
    throw err;
  }
  return pack;
}

/**
 * @param {{
 *   regimeCode?: string,
 *   taxableCents: number,
 *   profitCents?: number,
 *   includeStateSurcharge?: boolean,
 *   municipalDerramaBps?: number,
 *   ruleVersion?: string,
 * }} input
 */
function simulateIrc(input) {
  const pack = getRulePack(input.ruleVersion);
  const regimeCode = String(input.regimeCode || 'general');
  const regime = pack.regimes[regimeCode];
  if (!regime) {
    const err = new Error('Regime IRC desconhecido');
    err.code = 'UNKNOWN_RATE';
    throw err;
  }

  const taxableCents = Math.round(Number(input.taxableCents));
  if (!Number.isFinite(taxableCents) || taxableCents < 0) {
    const err = new Error('Matéria coletável inválida');
    err.code = 'INVALID_AMOUNT';
    throw err;
  }

  let profitCents =
    input.profitCents != null && input.profitCents !== ''
      ? Math.round(Number(input.profitCents))
      : taxableCents;
  if (!Number.isFinite(profitCents) || profitCents < 0) {
    const err = new Error('Lucro tributável inválido');
    err.code = 'INVALID_AMOUNT';
    throw err;
  }

  const irc = taxFromProgressiveBrackets(taxableCents, regime.brackets);
  const includeState = input.includeStateSurcharge !== false;
  const state = includeState
    ? stateSurchargeFromBands(profitCents, pack.stateSurcharge)
    : { taxCents: 0, parts: [] };

  const municipalBps = Math.round(Number(input.municipalDerramaBps) || 0);
  const municipal = municipalSurcharge(profitCents, municipalBps, pack.municipalDerramaMaxBps);

  const totalCents = irc.taxCents + state.taxCents + municipal.taxCents;
  const effectiveBps = taxableCents > 0 ? Math.round((totalCents * 10000) / taxableCents) : 0;

  return {
    calcType: 'irc',
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
    },
    input: {
      regimeCode: regime.code,
      taxableCents,
      profitCents,
      includeStateSurcharge: includeState,
      municipalDerramaBps: municipalBps,
    },
    result: {
      ircCents: irc.taxCents,
      stateSurchargeCents: state.taxCents,
      municipalSurchargeCents: municipal.taxCents,
      totalCents,
      effectiveBps,
      ircParts: irc.parts,
      stateParts: state.parts || [],
    },
    disclaimer:
      'Simulação de IRC (continente). Não é Modelo 22 oficial. Confirme regime, PME e derramas com um contabilista certificado.',
  };
}

module.exports = {
  DEFAULT_VERSION,
  listRulePacks,
  getRulePack,
  simulateIrc,
};
