/**
 * Auditoria de eventos sensíveis de segurança.
 */
const { getSupabaseAdmin } = require('../../db/supabase/client');
const { clientIp, clientUserAgent } = require('../../utils/client-ip');
const { logger } = require('../../utils/logger');

const REDACT_KEYS = new Set([
  'password',
  'passwordHash',
  'password_hash',
  'refreshToken',
  'accessToken',
  'token',
  'secret',
  'taxId',
  'tax_id',
  'nif',
]);

function sanitizeMetadata(input) {
  if (!input || typeof input !== 'object') return {};
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (REDACT_KEYS.has(key)) {
      out[key] = '[REDACTED]';
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = sanitizeMetadata(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function contextFromRequest(req) {
  if (!req) return { ip: null, userAgent: null };
  return {
    ip: clientIp(req),
    userAgent: clientUserAgent(req),
  };
}

async function recordSecurityEvent({
  firmId = null,
  actorRole = null,
  actorId = null,
  action,
  entityType = 'security',
  entityId = null,
  metadata = {},
  req = null,
}) {
  if (!action) return;

  const { ip, userAgent } = contextFromRequest(req);
  const payload = {
    firm_id: firmId || null,
    actor_role: actorRole || null,
    actor_id: actorId || null,
    action: String(action).slice(0, 120),
    entity_type: String(entityType || 'security').slice(0, 64),
    entity_id: entityId || null,
    metadata: {
      ...sanitizeMetadata(metadata),
      ...(userAgent ? { userAgent: String(userAgent).slice(0, 512) } : {}),
    },
    ip_address: ip || null,
  };

  try {
    const sb = getSupabaseAdmin();
    if (!sb) return;
    const { error } = await sb.from('audit_logs').insert(payload);
    if (error) throw error;
  } catch (err) {
    logger.safe.warn('SECURITY_AUDIT_WRITE_FAILED', {
      action,
      entityType,
      reason: err?.message || String(err),
    });
  }
}

async function recordAuthLoginSuccess({ user, req, scope }) {
  await recordSecurityEvent({
    firmId: user?.firmId || user?.firmId || null,
    actorRole: user?.role || scope,
    actorId: user?.id || null,
    action: 'auth.login.success',
    entityType: 'auth',
    entityId: user?.id || null,
    metadata: { scope, emailDomain: String(user?.email || '').split('@')[1] || null },
    req,
  });
}

async function recordAuthLoginFailed({ firmId, actorRole, actorId, scope, req, reason = 'invalid_credentials' }) {
  await recordSecurityEvent({
    firmId: firmId || null,
    actorRole,
    actorId,
    action: 'auth.login.failed',
    entityType: 'auth',
    entityId: actorId || null,
    metadata: { scope, reason },
    req,
  });
}

async function recordAuthAccountLocked({ firmId, scope, req }) {
  await recordSecurityEvent({
    firmId: firmId || null,
    action: 'auth.login.locked',
    entityType: 'auth',
    metadata: { scope },
    req,
  });
}

async function recordAuthPasswordReset({ userType, userId, firmId, req }) {
  await recordSecurityEvent({
    firmId: firmId || null,
    actorRole: userType === 'client' ? 'CLIENT' : 'FIRM',
    actorId: userId,
    action: 'auth.password.reset',
    entityType: 'auth',
    entityId: userId,
    metadata: { userType },
    req,
  });
}

async function recordDocumentAccess({ action, actor, documentId, firmId, clientId, req }) {
  await recordSecurityEvent({
    firmId,
    actorRole: actor?.role || null,
    actorId: actor?.id || null,
    action,
    entityType: 'document',
    entityId: documentId,
    metadata: { clientId: clientId || null },
    req,
  });
}

async function recordClientHubAccess({ actor, firmId, clientId, req }) {
  await recordSecurityEvent({
    firmId,
    actorRole: actor?.role || null,
    actorId: actor?.id || null,
    action: 'client.hub.view',
    entityType: 'client',
    entityId: clientId,
    metadata: { sensitive: true },
    req,
  });
}

async function recordFirmMutation({ action, actor, firmId, entityType, entityId, metadata, req }) {
  await recordSecurityEvent({
    firmId,
    actorRole: actor?.role || null,
    actorId: actor?.id || null,
    action,
    entityType,
    entityId,
    metadata,
    req,
  });
}

async function recordClientMutation({ action, actor, firmId, clientId, metadata, req }) {
  await recordFirmMutation({
    action,
    actor,
    firmId,
    entityType: 'client',
    entityId: clientId,
    metadata,
    req,
  });
}

async function recordDocumentMutation({ action, actor, firmId, documentId, clientId, metadata, req }) {
  await recordFirmMutation({
    action,
    actor,
    firmId,
    entityType: 'document',
    entityId: documentId,
    metadata: { clientId: clientId || null, ...metadata },
    req,
  });
}

async function recordObligationMutation({ action, actor, firmId, obligationId, metadata, req }) {
  await recordFirmMutation({
    action,
    actor,
    firmId,
    entityType: 'obligation',
    entityId: obligationId,
    metadata,
    req,
  });
}

async function recordSettingsMutation({ action, actor, firmId, metadata, req }) {
  await recordFirmMutation({
    action,
    actor,
    firmId,
    entityType: 'settings',
    entityId: firmId,
    metadata,
    req,
  });
}

async function recordTeamMutation({ action, actor, firmId, targetUserId, metadata, req }) {
  await recordFirmMutation({
    action,
    actor,
    firmId,
    entityType: 'team',
    entityId: targetUserId,
    metadata,
    req,
  });
}

async function recordAuthLogout({ user, req, scope }) {
  await recordSecurityEvent({
    firmId: user?.firmId || user?.firmId || null,
    actorRole: user?.role || null,
    actorId: user?.id || null,
    action: 'auth.logout',
    entityType: 'auth',
    entityId: user?.id || null,
    metadata: { scope },
    req,
  });
}

module.exports = {
  recordSecurityEvent,
  recordAuthLoginSuccess,
  recordAuthLoginFailed,
  recordAuthAccountLocked,
  recordAuthPasswordReset,
  recordDocumentAccess,
  recordClientHubAccess,
  recordFirmMutation,
  recordClientMutation,
  recordDocumentMutation,
  recordObligationMutation,
  recordSettingsMutation,
  recordTeamMutation,
  recordAuthLogout,
};
