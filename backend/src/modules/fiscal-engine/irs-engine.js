const ptIrs2026 = require('./rules/pt-irs-2026');
const { taxFromBrackets, solidarityFromBands, withQuotient } = require('./irs-math');

const RULE_PACKS = Object.freeze({
  [ptIrs2026.version]: ptIrs2026,
});

const DEFAULT_VERSION = ptIrs2026.version;

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
    brackets: r.brackets,
    solidarity: r.solidarity,
    rounding: r.rounding,
    limitations: r.limitations,
  }));
}

function getRulePack(version) {
  const pack = RULE_PACKS[version || DEFAULT_VERSION];
  if (!pack) {
    const err = new Error('Versão de regras IRS desconhecida');
    err.code = 'UNKNOWN_RULE_VERSION';
    throw err;
  }
  return pack;
}

/**
 * @param {{
 *   taxableIncomeCents: number,
 *   filingStatus?: 'single'|'joint',
 *   includeSolidarity?: boolean,
 *   ruleVersion?: string,
 * }} input
 */
function simulateIrsBrackets(input) {
  const pack = getRulePack(input.ruleVersion);
  const taxableIncomeCents = Math.round(Number(input.taxableIncomeCents));
  if (!Number.isFinite(taxableIncomeCents) || taxableIncomeCents < 0) {
    const err = new Error('Rendimento coletável inválido');
    err.code = 'INVALID_AMOUNT';
    throw err;
  }

  const filingStatus = input.filingStatus === 'joint' ? 'joint' : 'single';
  const quotient = filingStatus === 'joint' ? 2 : 1;
  const includeSolidarity = input.includeSolidarity !== false;

  const computed = withQuotient(taxableIncomeCents, quotient, (unitCents) => {
    const base = taxFromBrackets(unitCents, pack.brackets);
    const sol = includeSolidarity
      ? solidarityFromBands(unitCents, pack.solidarity)
      : { solidarityCents: 0, parts: [] };
    return {
      taxCents: base.taxCents,
      solidarityCents: sol.solidarityCents,
      bracketIndex: base.bracketIndex,
      parts: base.parts,
      solidarityParts: sol.parts,
    };
  });

  const taxCents = computed.taxCents;
  const solidarityCents = computed.solidarityCents || 0;
  const totalCents = taxCents + solidarityCents;
  const effectiveBps =
    taxableIncomeCents > 0 ? Math.round((totalCents * 10000) / taxableIncomeCents) : 0;

  return {
    calcType: 'irs_brackets',
    jurisdiction: pack.jurisdiction,
    tax: pack.tax,
    ruleVersion: pack.version,
    ruleStatus: pack.status,
    source: pack.source,
    rounding: pack.rounding,
    limitations: pack.limitations,
    input: {
      taxableIncomeCents,
      filingStatus,
      includeSolidarity,
      quotient,
    },
    result: {
      taxCents,
      solidarityCents,
      totalCents,
      effectiveBps,
      bracketIndex: computed.bracketIndex,
      taxablePerUnitCents: computed.taxablePerUnitCents ?? taxableIncomeCents,
      parts: computed.parts,
      solidarityParts: computed.solidarityParts || [],
    },
    disclaimer:
      'Simulação de coleta sobre rendimento coletável (escalões gerais, continente). Não é declaração oficial. Confirme enquadramento, deduções e retenções com um contabilista certificado.',
  };
}

module.exports = {
  DEFAULT_VERSION,
  listRulePacks,
  getRulePack,
  simulateIrsBrackets,
};
