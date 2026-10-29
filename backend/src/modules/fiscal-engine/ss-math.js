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
 * Rendimento relevante TI a partir de um valor bruto e coeficiente %.
 * Prestação de serviços: tipicamente 70 %. Vendas: tipicamente 20 %.
 */
function relevantIncomeFromGross(grossCents, relevantPct, label = 'Valor bruto') {
  const gross = assertNonNegInt(grossCents, label);
  const pct = Math.round(Number(relevantPct));
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
    const err = new Error('Percentagem de rendimento relevante inválida');
    err.code = 'INVALID_RATE';
    throw err;
  }
  return halfUpDiv(gross * pct, 100);
}

/** @deprecated alias — preferir relevantIncomeFromGross */
function relevantIncomeFromServices(servicesCents, relevantPct = 70) {
  return relevantIncomeFromGross(servicesCents, relevantPct, 'Prestação de serviços');
}

module.exports = {
  contributionFromBase,
  relevantIncomeFromGross,
  relevantIncomeFromServices,
};
