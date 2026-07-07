/**
 * Timeline de atividades e auditoria operacional TegLion.
 */
const { getRepository } = require('../../db/supabase/repositories');
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../db/supabase/client');

function ensureClient() {
  if (!isSupabaseConfigured()) return null;
  return getSupabaseAdmin();
}

async function recordActivity({
  firmId,
  clientId = null,
  actorRole,
  actorId,
  actorName,
  eventType,
  entityType = null,
  entityId = null,
  title,
  description = null,
  metadata = {},
  ipAddress = null,
}) {
  const sb = ensureClient();
  if (!sb) return null;

  const row = {
    firm_id: firmId,
    client_id: clientId,
    actor_role: actorRole,
    actor_id: actorId,
    actor_name: actorName,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    title,
    description,
    metadata,
  };

  const { data, error } = await sb.from('activity_events').insert(row).select().single();
  if (error) {
    console.warn('[activity] insert failed', error.message);
    return null;
  }

  try {
    await getRepository().writeAuditLog({
      firmId,
      actorRole,
      actorId,
      action: eventType,
      entityType: entityType || 'ACTIVITY',
      entityId: entityId || data?.id,
      metadata: { ...metadata, title, ipAddress },
    });
  } catch {
    // noop
  }

  return data;
}

async function listActivityForEntity({ firmId, entityType, entityId, limit = 50 }) {
  const sb = ensureClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from('activity_events')
    .select('*')
    .eq('firm_id', firmId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(mapActivityRow);
}

async function listActivityForClient({ firmId, clientId, limit = 30 }) {
  const sb = ensureClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from('activity_events')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(mapActivityRow);
}

function mapActivityRow(row) {
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    actorRole: row.actor_role,
    actorId: row.actor_id,
    actorName: row.actor_name,
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    title: row.title,
    description: row.description,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

module.exports = {
  recordActivity,
  listActivityForEntity,
  listActivityForClient,
};
