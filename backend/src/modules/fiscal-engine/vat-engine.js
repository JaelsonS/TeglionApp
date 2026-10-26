const ptIva2026 = require('./rules/pt-iva-2026');
const { fromNetCents, fromGrossCents } = require('./vat-math');

const RULE_PACKS = Object.freeze({
  [ptIva2026.version]: ptIva2026,
});

const DEFAULT_VERSION = ptIva2026.version;

function listRulePacks() {
  return Object.values(RULE_PACKS).map((r) => ({
    version: r.version,
    jurisdiction: r.jurisdiction,
    tax: r.tax,
    status: r.status,
    effectiveFrom: r.effectiveFrom,
    effectiveTo: r.effectiveTo,
    source: r.source,
    rates: r.rates,
    rounding: r.rounding,
    limitations: r.limitations,
  }));
}

function getRulePack(version) {
  const pack = RULE_PACKS[version || DEFAULT_VERSION];
  if (!pack) {
    const err = new Error('Versão de regras IVA desconhecida');
    err.code = 'UNKNOWN_RULE_VERSION';
    throw err;
  }
  return pack;
}

function resolveRate(pack, rateCode) {
  const rate = pack.rates.find((r) => r.code === rateCode);
  if (!rate) {
    const err = new Error('Taxa IVA desconhecida nesta versão de regras');
    err.code = 'UNKNOWN_RATE';
    throw err;
  }
  return rate;
}

/**
 * @param {{ direction: 'net_to_gross'|'gross_to_net', amountCents: number, rateCode: string, ruleVersion?: string }} input
 */
function simulateVat(input) {
  const pack = getRulePack(input.ruleVersion);
  const rate = resolveRate(pack, input.rateCode);
  const direction = input.direction === 'gross_to_net' ? 'gross_to_net' : 'net_to_gross';
  const amountCents = Math.round(Number(input.amountCents));

  const math =
    direction === 'gross_to_net'
      ? fromGrossCents(amountCents, rate.bps)
      : fromNetCents(amountCents, rate.bps);

  return {
    calcType: 'vat_net_gross',
    jurisdiction: pack.jurisdiction,
    tax: pack.tax,
    ruleVersion: pack.version,
    ruleStatus: pack.status,
    source: pack.source,
    rounding: pack.rounding,
    limitations: pack.limitations,
    rate: {
      code: rate.code,
      label: rate.label,
      percent: rate.percent,
      bps: rate.bps,
    },
    input: {
      direction,
      amountCents,
      rateCode: rate.code,
    },
    result: {
      netCents: math.netCents,
      vatCents: math.vatCents,
      grossCents: math.grossCents,
    },
    disclaimer:
      'Simulação de apoio. Não é apuramento de IVA nem declaração oficial. Confirme a taxa e o enquadramento com um contabilista certificado.',
  };
}

module.exports = {
  DEFAULT_VERSION,
  listRulePacks,
  getRulePack,
  simulateVat,
};
