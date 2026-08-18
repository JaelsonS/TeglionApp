/**
 * Chaves de cache com isolamento explícito por tenant.
 * Nunca omitir firmId — uma chave global seria um leak cross-tenant.
 */
function requirePart(value, name) {
  const s = String(value || '').trim();
  if (!s) {
    const err = new Error(`${name} is required for a tenant-scoped cache key`);
    err.code = 'CACHE_KEY_TENANT_REQUIRED';
    throw err;
  }
  return s;
}

function overdueSyncKey(firmId) {
  return `overdue-sync:${requirePart(firmId, 'firmId')}`;
}

function operationalDashboardKey(firmId) {
  return `operational-dashboard:${requirePart(firmId, 'firmId')}`;
}

function liveBadgeKey({ scope, firmId, actorId }) {
  return `live-badge:${requirePart(scope, 'scope')}:${requirePart(firmId, 'firmId')}:${requirePart(actorId, 'actorId')}`;
}

module.exports = {
  overdueSyncKey,
  operationalDashboardKey,
  liveBadgeKey,
};
