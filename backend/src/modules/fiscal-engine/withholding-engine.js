const packRules = require('./rules/pt-irs-wh-2026');
const { withholdingFromTable } = require('./withholding-math');

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
      minDependents: t.minDependents || 0,
    })),
  }));
}

function getRulePack(version) {
  const pack = RULE_PACKS[version || DEFAULT_VERSION];
  if (!pack) {
    const err = new Error('Versão de regras de retenção desconhecida');
    err.code = 'UNKNOWN_RULE_VERSION';
    throw err;
  }
  return pack;
}

/**
 * @param {{
 *   tableCode: string,
 *   remunerationCents: number,
 *   dependents?: number,
 *   ruleVersion?: string,
 * }} input
 */
function simulateWithholding(input) {
  const pack = getRulePack(input.ruleVersion);
  const code = String(input.tableCode || 'I').toUpperCase();
  const table = pack.tables[code];
  if (!table) {
    const err = new Error('Tabela de retenção desconhecida');
    err.code = 'UNKNOWN_RATE';
    throw err;
  }

  const remunerationCents = Math.round(Number(input.remunerationCents));
  if (!Number.isFinite(remunerationCents) || remunerationCents < 0) {
    const err = new Error('Remuneração mensal inválida');
    err.code = 'INVALID_AMOUNT';
    throw err;
  }

  let dependents = Math.round(Number(input.dependents) || 0);
  if (!Number.isFinite(dependents) || dependents < 0) {
    const err = new Error('Número de dependentes inválido');
    err.code = 'INVALID_AMOUNT';
    throw err;
  }
  if (table.minDependents && dependents < table.minDependents) {
    const err = new Error(
      `A tabela ${table.code} exige pelo menos ${table.minDependents} dependente(s)`,
    );
    err.code = 'INVALID_AMOUNT';
    throw err;
  }

  const math = withholdingFromTable(remunerationCents, table.brackets, dependents, {
    largeFamilyRateReductionMilli: pack.largeFamilyRateReductionMilli,
  });

  return {
    calcType: 'irs_withholding',
    jurisdiction: pack.jurisdiction,
    tax: pack.tax,
    ruleVersion: pack.version,
    ruleStatus: pack.status,
    source: pack.source,
    rounding: pack.rounding,
    limitations: pack.limitations,
    table: {
      code: table.code,
      label: table.label,
    },
    input: {
      tableCode: table.code,
      remunerationCents,
      dependents,
    },
    result: {
      withholdingCents: math.withholdingCents,
      netCents: math.netCents,
      rateMilli: math.rateMilli,
      parcelaCents: math.parcelaCents,
      additionalCents: math.additionalCents,
      bracketIndex: math.bracketIndex,
      effectiveBps: math.effectiveBps,
      familyRateReduced: math.rateMilli !== math.rateMilliBeforeFamilyReduction,
    },
    disclaimer:
      'Simulação de retenção na fonte (continente, tabelas I–III). Não é recibo de vencimento oficial. Confirme a tabela e o despacho vigentes com um contabilista certificado.',
  };
}

module.exports = {
  DEFAULT_VERSION,
  listRulePacks,
  getRulePack,
  simulateWithholding,
};
