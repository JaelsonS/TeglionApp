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
    firmId: row.firm_id || null,
    action: row.action,
    actorRole: row.actor_role,
    actorId: row.actor_id,
    entityType: row.entity_type || null,
    entityId: row.entity_id || null,
    metadata: row.metadata || {},
    ipAddress: row.ip_address || null,
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

/**
 * Leitura cross-tenant só para Control Center (caller deve autorizar PLATFORM_OPS).
 */
async function listPlatformAuditLogs({
  limit = 50,
  offset = 0,
  action = null,
  firmId = null,
  sinceIso = null,
} = {}) {
  const sb = ensureClient();
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  let q = sb.from('audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (firmId) q = q.eq('firm_id', firmId);
  if (action) q = q.eq('action', String(action).trim());
  if (sinceIso) q = q.gte('created_at', sinceIso);
  q = q.range(safeOffset, safeOffset + safeLimit - 1);
  const { data, error, count } = await q;
  if (error) throw error;
  return { items: (data || []).map(map), total: count ?? null };
}

module.exports = { writeAuditLog, listByEntity, listPlatformAuditLogs };
