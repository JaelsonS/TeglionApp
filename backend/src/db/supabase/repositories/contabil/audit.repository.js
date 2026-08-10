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

function map(row) {
  if (!row) return null;
  return {
    id: row.id,
    action: row.action,
    actorRole: row.actor_role,
    actorId: row.actor_id,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

/**
 * Histórico de uma entidade (ex.: uma ServiceInquiry) — reaproveita audit_logs,
 * já escrito em todo o ciclo de vida (criação, submissão, mudança de estado,
 * pendências, entregas), em vez de duplicar em activity_events (ver plan file
 * da sessão, Fase 4). Só leitura, sempre scoped a firm_id.
 */
async function listByEntity({ firmId, entityType, entityId, limit = 50 }) {
  const sb = ensureClient();
  const { data, error } = await sb
    .from('audit_logs')
    .select('*')
    .eq('firm_id', firmId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(map);
}

module.exports = { writeAuditLog, listByEntity };
