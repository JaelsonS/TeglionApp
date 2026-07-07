/**
 * Alinha valores de FRONTEND_URL / CORS_ORIGINS com o que o browser envia em `Origin`:
 * apenas `scheme://host:port` (sem path, sem barra final).
 *
 * Ex.: `https://teglion.com/` → `https://teglion.com`
 */
function toOriginAllowlistKey(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  try {
    const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    return new URL(withScheme).origin;
  } catch {
    return s.replace(/\/+$/, '') || null;
  }
}

function uniqueOrigins(list) {
  return [...new Set((list || []).map(toOriginAllowlistKey).filter(Boolean))];
}

module.exports = { toOriginAllowlistKey, uniqueOrigins };
