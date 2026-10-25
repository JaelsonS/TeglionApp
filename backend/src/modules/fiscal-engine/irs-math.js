/**
 * Coleta de IRS (escalões gerais) em cêntimos — art. 68.º n.ºs 1–2 CIRS.
 * rateMilli: percentagem × 1000 (12,5 % → 12500).
 */

const { assertNonNegInt, halfUpDiv } = require('./vat-math');

function applyRateCents(amountCents, rateMilli) {
  if (!rateMilli) return 0;
  return halfUpDiv(amountCents * rateMilli, 100_000);
}

/**
 * @param {number} taxableCents rendimento coletável
 * @param {Array<{ upToCents: number|null, normalMilli: number, avgMilli: number|null }>} brackets
 */
function taxFromBrackets(taxableCents, brackets) {
  const income = assertNonNegInt(taxableCents, 'Rendimento coletável');
  if (income === 0) {
    return { taxCents: 0, bracketIndex: 0, parts: [] };
  }

  let bracketIndex = brackets.length - 1;
  for (let i = 0; i < brackets.length; i += 1) {
    const up = brackets[i].upToCents;
    if (up == null || income <= up) {
      bracketIndex = i;
      break;
    }
  }

  if (bracketIndex === 0) {
    const taxCents = applyRateCents(income, brackets[0].normalMilli);
    return {
      taxCents,
      bracketIndex: 0,
      parts: [
        {
          kind: 'first_bracket',
          baseCents: income,
          rateMilli: brackets[0].normalMilli,
          taxCents,
        },
      ],
    };
  }

  const prev = brackets[bracketIndex - 1];
  const cur = brackets[bracketIndex];
  const baseAvg = prev.upToCents;
  const excess = income - baseAvg;
  const partAvg = applyRateCents(baseAvg, prev.avgMilli);
  const partNormal = applyRateCents(excess, cur.normalMilli);
  const taxCents = partAvg + partNormal;

  return {
    taxCents,
    bracketIndex,
    parts: [
      {
        kind: 'average_up_to_prev',
        baseCents: baseAvg,
        rateMilli: prev.avgMilli,
        taxCents: partAvg,
      },
      {
        kind: 'normal_excess',
        baseCents: excess,
        rateMilli: cur.normalMilli,
        taxCents: partNormal,
      },
    ],
  };
}

/**
 * Taxa adicional de solidariedade — art. 68.º-A.
 * @param {Array<{ upToCents: number|null, rateMilli: number }>} bands
 */
function solidarityFromBands(taxableCents, bands) {
  const income = assertNonNegInt(taxableCents, 'Rendimento coletável');
  let remaining = income;
  let prevCap = 0;
  let total = 0;
  const parts = [];

  for (const band of bands) {
    const openEnded = band.upToCents == null;
    const slice = openEnded
      ? remaining
      : Math.min(remaining, Math.max(0, band.upToCents - prevCap));
    if (slice <= 0) break;
    const tax = applyRateCents(slice, band.rateMilli);
    if (band.rateMilli > 0 && tax > 0) {
      parts.push({
        baseCents: slice,
        rateMilli: band.rateMilli,
        taxCents: tax,
        fromCents: prevCap,
        toCents: band.upToCents,
      });
    }
    total += tax;
    remaining -= slice;
    prevCap = openEnded ? prevCap + slice : band.upToCents;
    if (remaining <= 0) break;
  }

  return { solidarityCents: total, parts };
}

/**
 * Tributação conjunta (art. 69.º): metade do coletável → coleta × 2.
 */
function withQuotient(taxableCents, quotient, computeOnce) {
  const q = Math.max(1, Math.round(Number(quotient) || 1));
  if (q === 1) return computeOnce(taxableCents);

  const half = halfUpDiv(taxableCents, q);
  const once = computeOnce(half);
  return {
    ...once,
    taxCents: once.taxCents * q,
    solidarityCents: (once.solidarityCents || 0) * q,
    quotient: q,
    taxablePerUnitCents: half,
  };
}

module.exports = {
  applyRateCents,
  taxFromBrackets,
  solidarityFromBands,
  withQuotient,
};
