/**
 * Aritmética monetária em cêntimos inteiros (evita float binário).
 * Taxa em basis points: 2300 = 23,00 %.
 */

function assertNonNegInt(n, label) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v) || v < 0) {
    const err = new Error(`${label || 'Valor'} inválido`);
    err.code = 'INVALID_AMOUNT';
    throw err;
  }
  return v;
}

function assertBps(bps) {
  const v = Math.round(Number(bps));
  if (!Number.isFinite(v) || v < 0 || v > 10000) {
    const err = new Error('Taxa inválida');
    err.code = 'INVALID_RATE';
    throw err;
  }
  return v;
}

/** half-up: (n + 5000) / 10000 para divisão por 10000 com resto */
function halfUpDiv(numerator, denominator) {
  if (denominator <= 0) throw new Error('Denominador inválido');
  const n = BigInt(numerator);
  const d = BigInt(denominator);
  const half = d / 2n;
  if (n >= 0n) return Number((n + half) / d);
  return Number((n - half) / d);
}

/**
 * A partir do líquido (sem IVA): IVA = round(net * bps / 10000); total = net + IVA
 */
function fromNetCents(netCents, rateBps) {
  const net = assertNonNegInt(netCents, 'Líquido');
  const bps = assertBps(rateBps);
  const vat = halfUpDiv(net * bps, 10000);
  return {
    netCents: net,
    vatCents: vat,
    grossCents: net + vat,
    rateBps: bps,
    direction: 'net_to_gross',
  };
}

/**
 * A partir do total (com IVA): net = round(gross * 10000 / (10000+bps)); vat = gross - net
 * Garante net + vat = gross exactamente.
 */
function fromGrossCents(grossCents, rateBps) {
  const gross = assertNonNegInt(grossCents, 'Total');
  const bps = assertBps(rateBps);
  const net = halfUpDiv(gross * 10000, 10000 + bps);
  const vat = gross - net;
  return {
    netCents: net,
    vatCents: vat,
    grossCents: gross,
    rateBps: bps,
    direction: 'gross_to_net',
  };
}

module.exports = {
  assertNonNegInt,
  assertBps,
  halfUpDiv,
  fromNetCents,
  fromGrossCents,
};
