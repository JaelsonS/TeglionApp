const { ensureClient } = require('./shared');

async function writeAuditLog({ firmId, actorRole, actorId, action, entityType, entityId, metadata, ipAddress }) {
  const sb = ensureClient();
  const { error } = await sb.from('audit_logs').insert({
    firm_id: firmId || null,
    actor_role: actorRole,
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata || {},
    ip_address: ipAddress || null,
  });
  if (error) throw error;
}

module.exports = { writeAuditLog };
