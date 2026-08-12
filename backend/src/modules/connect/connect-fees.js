/** Default 200 = 2,00% (basis points). Lê process.env para evitar dependência de env.js nos testes/termos. */
const DEFAULT_PLATFORM_FEE_BPS = 200;

function getPlatformFeeBps() {
  const raw = Number(process.env.STRIPE_CONNECT_PLATFORM_FEE_BPS ?? DEFAULT_PLATFORM_FEE_BPS);
  if (!Number.isFinite(raw) || raw < 0) return DEFAULT_PLATFORM_FEE_BPS;
  return Math.min(Math.floor(raw), 3000);
}

function getPlatformFeePercentLabel() {
  const bps = getPlatformFeeBps();
  const pct = bps / 100;
  return Number.isInteger(pct) ? String(pct) : pct.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Taxa de serviço Teglion em cêntimos (application_fee_amount).
 * Nunca ≥ ao valor total; arredonda ao cêntimo mais próximo.
 */
function computePlatformFeeCents(amountCents) {
  const amount = Math.floor(Number(amountCents));
  if (!Number.isFinite(amount) || amount < 1) return 0;
  const bps = getPlatformFeeBps();
  if (bps <= 0) return 0;
  let fee = Math.round((amount * bps) / 10000);
  if (fee < 1 && bps > 0 && amount >= 50) fee = 1;
  if (fee >= amount) fee = Math.max(0, amount - 1);
  return fee;
}

module.exports = {
  DEFAULT_PLATFORM_FEE_BPS,
  getPlatformFeeBps,
  getPlatformFeePercentLabel,
  computePlatformFeeCents,
};
