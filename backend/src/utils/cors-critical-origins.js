const { BRAND } = require('../config/brand');

/**
 * Origens que entram sempre na allowlist CORS/CSRF além de CORS_ORIGINS.
 *
 * Em staging NÃO injectamos BRAND.productionOrigins — senão a API staging
 * aceita Origin https://teglion.com e o isolamento de ambiente falha.
 */
function isStagingFrontendUrl(frontendUrl) {
  try {
    const host = new URL(String(frontendUrl || '')).hostname.toLowerCase();
    return host === 'staging.teglion.com' || host.endsWith('.staging.teglion.com');
  } catch {
    return false;
  }
}

function buildCriticalCorsOrigins(frontendUrl) {
  const origins = [];
  const frontend = String(frontendUrl || '').trim().replace(/\/+$/, '');
  if (frontend) origins.push(frontend);

  if (!isStagingFrontendUrl(frontend)) {
    for (const o of BRAND.productionOrigins || []) {
      if (o) origins.push(o);
    }
  }

  return origins;
}

module.exports = {
  isStagingFrontendUrl,
  buildCriticalCorsOrigins,
};
