const packRules = require('./rules/pt-imt-2026');
const { imtFromBrackets, imtFromFlatRate } = require('./imt-math');

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
    tables: Object.values(r.tables).map((t) => ({
      code: t.code,
      label: t.label,
    })),
    flatRates: Object.values(r.flatRates).map((f) => ({
      code: f.code,
      label: f.label,
      rateMilli: f.rateMilli,
      ratePercent: f.rateMilli / 100,
    })),
  }));
}

function getRulePack(version) {
  const pack = RULE_PACKS[version || DEFAULT_VERSION];
  if (!pack) {
    const err = new Error('Versão de regras IMT desconhecida');
    err.code = 'UNKNOWN_RULE_VERSION';
    throw err;
  }
  return pack;
}

/**
 * @param {{
 *   tableCode?: string,
 *   flatRateCode?: string,
 *   taxableValueCents: number,
 *   ruleVersion?: string,
 * }} input
 */
function simulateImt(input) {
  const pack = getRulePack(input.ruleVersion);
  const taxableValueCents = Math.round(Number(input.taxableValueCents));
  if (!Number.isFinite(taxableValueCents) || taxableValueCents < 0) {
    const err = new Error('Valor tributável inválido');
    err.code = 'INVALID_AMOUNT';
    throw err;
  }

  const flatCode = input.flatRateCode ? String(input.flatRateCode) : null;
  const tableCode = input.tableCode ? String(input.tableCode).toUpperCase() : null;

  let math;
  let regime;

  if (flatCode) {
    const flat = pack.flatRates[flatCode];
    if (!flat) {
      const err = new Error('Taxa fixa IMT desconhecida');
      err.code = 'UNKNOWN_RATE';
      throw err;
    }
    math = imtFromFlatRate(taxableValueCents, flat.rateMilli);
    regime = { kind: 'flat', code: flat.code, label: flat.label };
  } else {
    const code = tableCode || 'I';
    const table = pack.tables[code];
    if (!table) {
      const err = new Error('Tabela IMT desconhecida');
      err.code = 'UNKNOWN_RATE';
      throw err;
    }
    math = imtFromBrackets(taxableValueCents, table.brackets);
    regime = { kind: 'table', code: table.code, label: table.label };
  }

  const effectiveBps =
    taxableValueCents > 0 ? Math.round((math.imtCents * 10000) / taxableValueCents) : 0;

  return {
    calcType: 'imt',
    jurisdiction: pack.jurisdiction,
    tax: pack.tax,
    ruleVersion: pack.version,
    ruleStatus: pack.status,
    source: pack.source,
    rounding: pack.rounding,
    limitations: pack.limitations,
    regime,
    input: {
      tableCode: regime.kind === 'table' ? regime.code : null,
      flatRateCode: regime.kind === 'flat' ? regime.code : null,
      taxableValueCents,
    },
    result: {
      imtCents: math.imtCents,
      rateMilli: math.rateMilli,
      parcelaCents: math.parcelaCents,
      flat: math.flat,
      bracketIndex: math.bracketIndex,
      effectiveBps,
    },
    disclaimer:
      'Simulação de IMT (continente). Não é liquidação oficial. Confirme valor tributável, tabela e isenções no Portal das Finanças.',
  };
}

module.exports = {
  DEFAULT_VERSION,
  listRulePacks,
  getRulePack,
  simulateImt,
};
