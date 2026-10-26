/**
 * IMT em cêntimos — taxa marginal + parcela, ou taxa única (flat).
 */

const { assertNonNegInt, halfUpDiv } = require('./vat-math');

function applyRateCents(amountCents, rateMilli) {
  if (!rateMilli) return 0;
  return halfUpDiv(amountCents * rateMilli, 100_000);
}

/**
 * @param {number} taxableCents valor sobre que incide o IMT
 * @param {Array<{ upToCents: number|null, rateMilli: number, parcelaCents: number, flat?: boolean }>} brackets
 */
function imtFromBrackets(taxableCents, brackets) {
  const value = assertNonNegInt(taxableCents, 'Valor tributável');
  if (value === 0) {
    return { imtCents: 0, bracketIndex: 0, rateMilli: 0, parcelaCents: 0, flat: false };
  }

  let bracketIndex = brackets.length - 1;
  for (let i = 0; i < brackets.length; i += 1) {
    const up = brackets[i].upToCents;
    if (up == null || value <= up) {
      bracketIndex = i;
      break;
    }
  }

  const b = brackets[bracketIndex];
  const rateMilli = b.rateMilli || 0;
  const flat = Boolean(b.flat);
  const parcelaCents = flat ? 0 : Math.round(Number(b.parcelaCents) || 0);
  const gross = applyRateCents(value, rateMilli);
  const imtCents = Math.max(0, flat ? gross : gross - parcelaCents);

  return {
    imtCents,
    bracketIndex,
    rateMilli,
    parcelaCents,
    flat,
  };
}

function imtFromFlatRate(taxableCents, rateMilli) {
  const value = assertNonNegInt(taxableCents, 'Valor tributável');
  return {
    imtCents: applyRateCents(value, rateMilli),
    bracketIndex: 0,
    rateMilli,
    parcelaCents: 0,
    flat: true,
  };
}

module.exports = {
  applyRateCents,
  imtFromBrackets,
  imtFromFlatRate,
};
