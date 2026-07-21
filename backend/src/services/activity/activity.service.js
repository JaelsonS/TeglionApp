/**
 * Timeline de atividades e auditoria operacional Teglion.
 */
const { getRepository } = require('../../db/supabase/repositories');
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../db/supabase/client');
const { AppError } = require('../../middlewares/error.middleware');

function ensureClient() {
  if (!isSupabaseConfigured()) return null;
  return getSupabaseAdmin();
}

function mapTimelineKind(eventType) {
  const t = String(eventType || '').toUpperCase();
  if (t.includes('MESSAGE')) return 'message';
  if (t.includes('DOCUMENT') || t.includes('UPLOAD')) return 'document';
  if (t.includes('TASK')) return 'task';
  if (t.includes('OBLIGATION')) return 'obligation';
  if (t.includes('CLIENT')) return 'profile';
  if (t.includes('NEWS') || t.includes('ALERT') || t.includes('BROADCAST')) return 'alert';
  return 'activity';
}

function eventTypePatternsForKind(kind) {
  const k = String(kind || '').toLowerCase();
  if (k === 'message') return ['MESSAGE'];
  if (k === 'document') return ['DOCUMENT', 'UPLOAD'];
  if (k === 'task') return ['TASK'];
  if (k === 'obligation') return ['OBLIGATION'];
  if (k === 'profile') return ['CLIENT'];
  if (k === 'alert') return ['NEWS', 'ALERT', 'BROADCAST'];
  return null;
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

/**
 * Feed do hub: por defeito só eventos visíveis (não ocultos).
 */
async function listActivityForClient({ firmId, clientId, limit = 40, includeHidden = false }) {
  const sb = ensureClient();
  if (!sb) return [];
  let query = sb
    .from('activity_events')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (!includeHidden) {
    query = query.is('hidden_from_feed_at', null);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapActivityRow);
}

async function hideActivityForClient({ firmId, clientId, activityId }) {
  const sb = ensureClient();
  if (!sb) throw new AppError('Base de dados indisponível', 503);

  const id = String(activityId || '').trim();
  if (!id) throw new AppError('Actividade inválida', 400);

  const { data, error } = await sb
    .from('activity_events')
    .update({ hidden_from_feed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new AppError('Actividade não encontrada', 404);
  return mapActivityRow(data);
}

async function unhideActivityForClient({ firmId, clientId, activityId }) {
  const sb = ensureClient();
  if (!sb) throw new AppError('Base de dados indisponível', 503);

  const id = String(activityId || '').trim();
  if (!id) throw new AppError('Actividade inválida', 400);

  const { data, error } = await sb
    .from('activity_events')
    .update({ hidden_from_feed_at: null })
    .eq('id', id)
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new AppError('Actividade não encontrada', 404);
  return mapActivityRow(data);
}

async function hideAllVisibleForClient({ firmId, clientId }) {
  const sb = ensureClient();
  if (!sb) throw new AppError('Base de dados indisponível', 503);

  const now = new Date().toISOString();
  const { data, error } = await sb
    .from('activity_events')
    .update({ hidden_from_feed_at: now })
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .is('hidden_from_feed_at', null)
    .select('id');

  if (error) throw error;
  return { hidden: (data || []).length };
}

/**
 * Histórico completo com filtros (inclui ocultos).
 */
async function listActivityHistory({
  firmId,
  clientId,
  from = null,
  to = null,
  kind = null,
  q = null,
  hidden = 'all',
  page = 1,
  limit = 40,
}) {
  const sb = ensureClient();
  if (!sb) return { items: [], total: 0, page: 1, limit };

  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 40));
  const safePage = Math.max(1, Number(page) || 1);
  const fromIdx = (safePage - 1) * safeLimit;

  let query = sb
    .from('activity_events')
    .select('*', { count: 'exact' })
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .range(fromIdx, fromIdx + safeLimit - 1);

  if (from) query = query.gte('created_at', new Date(from).toISOString());
  if (to) {
    const end = new Date(to);
    if (!Number.isNaN(end.getTime()) && String(to).length <= 10) {
      end.setHours(23, 59, 59, 999);
    }
    query = query.lte('created_at', end.toISOString());
  }

  const hiddenMode = String(hidden || 'all').toLowerCase();
  if (hiddenMode === 'visible') query = query.is('hidden_from_feed_at', null);
  if (hiddenMode === 'hidden') query = query.not('hidden_from_feed_at', 'is', null);

  const patterns = eventTypePatternsForKind(kind);
  if (patterns) {
    // PostgREST: or on event_type ilike
    const orClause = patterns.map((p) => `event_type.ilike.%${p}%`).join(',');
    query = query.or(orClause);
  } else if (kind && String(kind).toLowerCase() === 'activity') {
    // Exclude known mapped kinds — approximate via not matching common prefixes
    query = query
      .not('event_type', 'ilike', '%MESSAGE%')
      .not('event_type', 'ilike', '%DOCUMENT%')
      .not('event_type', 'ilike', '%UPLOAD%')
      .not('event_type', 'ilike', '%TASK%')
      .not('event_type', 'ilike', '%OBLIGATION%')
      .not('event_type', 'ilike', '%CLIENT%')
      .not('event_type', 'ilike', '%NEWS%')
      .not('event_type', 'ilike', '%ALERT%')
      .not('event_type', 'ilike', '%BROADCAST%');
  }

  const search = String(q || '').trim();
  if (search) {
    const safe = search.replace(/[%_,]/g, ' ').slice(0, 80);
    query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    items: (data || []).map(mapActivityRow),
    total: count || 0,
    page: safePage,
    limit: safeLimit,
  };
}

function mapActivityRow(row) {
  const hiddenFromFeedAt = row.hidden_from_feed_at || null;
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
    hiddenFromFeedAt,
    kind: mapTimelineKind(row.event_type),
    hiddenFromFeed: Boolean(hiddenFromFeedAt),
  };
}

function toTimelineItem(a) {
  return {
    id: `activity-${a.id}`,
    kind: a.kind || mapTimelineKind(a.eventType),
    at: a.createdAt,
    title: a.title,
    description: a.description || null,
    actorRole: a.actorRole,
    actorName: a.actorName,
    entityType: a.entityType,
    entityId: a.entityId,
    eventType: a.eventType,
    deletable: true,
    hideable: true,
    activityId: a.id,
    hiddenFromFeed: Boolean(a.hiddenFromFeedAt),
    hiddenFromFeedAt: a.hiddenFromFeedAt || null,
  };
}

module.exports = {
  recordActivity,
  listActivityForEntity,
  listActivityForClient,
  hideActivityForClient,
  unhideActivityForClient,
  hideAllVisibleForClient,
  listActivityHistory,
  mapTimelineKind,
  toTimelineItem,
  _test: {
    mapTimelineKind,
    eventTypePatternsForKind,
    mapActivityRow,
  },
};
