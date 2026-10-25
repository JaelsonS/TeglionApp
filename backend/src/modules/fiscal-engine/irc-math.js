/**
 * IRC + derramas em cêntimos. rateMilli: percentagem × 1000 (19 % → 19000).
 */

const { assertNonNegInt, halfUpDiv } = require('./vat-math');

function applyRateCents(amountCents, rateMilli) {
  if (!rateMilli) return 0;
  return halfUpDiv(amountCents * rateMilli, 100_000);
}

/**
 * Escalonamento progressivo (PME): aplica taxa a cada fatia.
 * @param {Array<{ upToCents: number|null, rateMilli: number }>} brackets
 */
function taxFromProgressiveBrackets(taxableCents, brackets) {
  const income = assertNonNegInt(taxableCents, 'Matéria coletável');
  let remaining = income;
  let prevCap = 0;
  let total = 0;
  const parts = [];

  for (const band of brackets) {
    if (remaining <= 0) break;
    const openEnded = band.upToCents == null;
    const slice = openEnded
      ? remaining
      : Math.min(remaining, Math.max(0, band.upToCents - prevCap));
    if (slice <= 0) {
      if (!openEnded) prevCap = band.upToCents;
      continue;
    }
    const tax = applyRateCents(slice, band.rateMilli);
    parts.push({
      baseCents: slice,
      rateMilli: band.rateMilli,
      taxCents: tax,
      fromCents: prevCap,
      toCents: band.upToCents,
    });
    total += tax;
    remaining -= slice;
    prevCap = openEnded ? prevCap + slice : band.upToCents;
  }

  return { taxCents: total, parts };
}

/**
 * Derrama estadual — faixas marginais sobre lucro tributável.
 */
function stateSurchargeFromBands(profitCents, bands) {
  return taxFromProgressiveBrackets(profitCents, bands);
}

/**
 * Derrama municipal: taxa única (bps) sobre lucro tributável. Máx. 150 bps = 1,5 %.
 */
function municipalSurcharge(profitCents, rateBps, maxBps = 150) {
  const profit = assertNonNegInt(profitCents, 'Lucro tributável');
  let bps = Math.round(Number(rateBps) || 0);
  if (!Number.isFinite(bps) || bps < 0) {
    const err = new Error('Taxa de derrama municipal inválida');
    err.code = 'INVALID_RATE';
    throw err;
  }
  if (bps > maxBps) {
    const err = new Error(`Derrama municipal não pode exceder ${maxBps / 100} %`);
    err.code = 'INVALID_RATE';
    throw err;
  }
  return {
    taxCents: applyRateCents(profit, bps * 10), // bps → milli (1.5% = 150 bps = 1500 milli)
    rateBps: bps,
  };
}

module.exports = {
  applyRateCents,
  taxFromProgressiveBrackets,
  stateSurchargeFromBands,
  municipalSurcharge,
};
