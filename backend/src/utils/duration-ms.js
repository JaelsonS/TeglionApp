/**
 * Converte strings estilo JWT (15m, 1h, 7d) em milissegundos.
 */
function parseDurationMs(raw, fallbackMs = 15 * 60 * 1000) {
  const s = String(raw || '').trim();
  if (!s) return fallbackMs;

  if (/^\d+$/.test(s)) {
    return Number(s);
  }

  const match = s.match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d)?$/i);
  if (!match) return fallbackMs;

  const value = Number(match[1]);
  const unit = String(match[2] || 's').toLowerCase();
  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return Math.round(value * (multipliers[unit] || 1000));
}

module.exports = {
  parseDurationMs,
};
