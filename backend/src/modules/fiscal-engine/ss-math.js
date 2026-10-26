/**
 * Contribuições SS em cêntimos. Taxa em basis points (1100 = 11,00 %).
 */

const { assertNonNegInt, assertBps, halfUpDiv } = require('./vat-math');

function contributionFromBase(baseCents, rateBps) {
  const base = assertNonNegInt(baseCents, 'Base de incidência');
  const bps = assertBps(rateBps);
  return halfUpDiv(base * bps, 10000);
}

/**
 * Rendimento relevante TI (prestação de serviços): pct% do valor bruto.
 * Default 70 % (art. regime TI — prestação de serviços).
 */
function relevantIncomeFromServices(servicesCents, relevantPct = 70) {
  const services = assertNonNegInt(servicesCents, 'Prestação de serviços');
  const pct = Math.round(Number(relevantPct));
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
    const err = new Error('Percentagem de rendimento relevante inválida');
    err.code = 'INVALID_RATE';
    throw err;
  }
  return halfUpDiv(services * pct, 100);
}

module.exports = {
  contributionFromBase,
  relevantIncomeFromServices,
};
