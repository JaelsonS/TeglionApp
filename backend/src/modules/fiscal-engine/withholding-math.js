/**
 * Cálculo de retenção na fonte IRS (modelo marginal 2026) em cêntimos.
 */

const { assertNonNegInt, halfUpDiv } = require('./vat-math');

function applyRateCents(amountCents, rateMilli) {
  if (!rateMilli) return 0;
  return halfUpDiv(amountCents * rateMilli, 100_000);
}

/**
 * Parcela a abater: valor fixo OU rate × factor × (anchor − R).
 */
function resolveParcelaCents(remunerationCents, bracket) {
  if (bracket.parcelaFormula) {
    const { rateMilli, factorMilli, anchorCents } = bracket.parcelaFormula;
    const diff = anchorCents - remunerationCents;
    if (diff <= 0) return 0;
    // rateMilli/1e5 * factorMilli/1e3 * diff = rate*factor*diff / 1e8
    return halfUpDiv(rateMilli * factorMilli * diff, 100_000_000);
  }
  return Math.round(Number(bracket.parcelaCents) || 0);
}

/**
 * @param {number} remunerationCents
 * @param {Array} brackets
 * @param {number} dependents
 * @param {{ largeFamilyRateReductionMilli?: number }} opts
 */
function withholdingFromTable(remunerationCents, brackets, dependents = 0, opts = {}) {
  const R = assertNonNegInt(remunerationCents, 'Remuneração mensal');
  const deps = Math.max(0, Math.min(20, Math.round(Number(dependents) || 0)));

  let bracketIndex = brackets.length - 1;
  for (let i = 0; i < brackets.length; i += 1) {
    const up = brackets[i].upToCents;
    if (up == null || R <= up) {
      bracketIndex = i;
      break;
    }
  }

  const bracket = brackets[bracketIndex];
  let rateMilli = bracket.rateMilli || 0;

  // n.º 5 alínea h) — ≥ 3 dependentes: −1 p.p. na taxa marginal
  const reduction = opts.largeFamilyRateReductionMilli || 0;
  if (deps >= 3 && rateMilli > 0 && reduction > 0) {
    rateMilli = Math.max(0, rateMilli - reduction);
  }

  const grossTax = applyRateCents(R, rateMilli);
  const parcela = resolveParcelaCents(R, bracket);
  const additionalUnit = Math.round(Number(bracket.additionalPerDependentCents) || 0);
  const additional = additionalUnit * deps;
  const raw = grossTax - parcela - additional;
  const withholdingCents = Math.max(0, raw);
  const netCents = R - withholdingCents;
  const effectiveBps = R > 0 ? Math.round((withholdingCents * 10000) / R) : 0;

  return {
    withholdingCents,
    netCents,
    remunerationCents: R,
    rateMilli,
    rateMilliBeforeFamilyReduction: bracket.rateMilli || 0,
    parcelaCents: parcela,
    additionalCents: additional,
    dependents: deps,
    bracketIndex,
    effectiveBps,
  };
}

module.exports = {
  applyRateCents,
  resolveParcelaCents,
  withholdingFromTable,
};
