const { getSupabaseAdmin } = require('../client');
const { buildIlikeOrFilter } = require('../../../utils/postgrest-filter');

function mapBroadcast(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    firmId: row.firm_id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    body: row.body,
    category: row.category,
    priority: row.priority,
    dueAt: row.due_at,
    scheduledAt: row.scheduled_at,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
    status: row.status,
    targetType: row.target_type,
    targetClientIds: row.target_client_ids || [],
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    attachments: row.attachments || [],
    pinned: row.pinned,
    readConfirmationRequired: row.read_confirmation_required,
    coverUrl: row.cover_url,
    authorId: row.author_id,
    authorName: row.author_name,
    deliveryCount: row.delivery_count || 0,
    readCount: row.read_count || 0,
    ackCount: row.ack_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listBroadcasts(firmId, { status, category, priority, search, limit = 50, offset = 0 } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('firm_broadcasts')
    .select('*', { count: 'exact' })
    .eq('firm_id', firmId)
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) q = q.eq('status', status);
  if (category) q = q.eq('category', category);
  if (priority) q = q.eq('priority', priority);
  if (search) {
    const orFilter = buildIlikeOrFilter(['title', 'body'], search);
    if (orFilter) q = q.or(orFilter);
  }
  const { data, error, count } = await q;
  if (error) throw error;
  return { items: (data || []).map(mapBroadcast), total: count || 0 };
}

async function findById(firmId, id) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_broadcasts')
    .select('*')
    .eq('firm_id', firmId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return mapBroadcast(data);
}

async function findBySlug(firmId, slug) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_broadcasts')
    .select('*')
    .eq('firm_id', firmId)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return mapBroadcast(data);
}

async function insertBroadcast(row) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('firm_broadcasts').insert(row).select().single();
  if (error) throw error;
  return mapBroadcast(data);
}

async function updateBroadcast(id, firmId, patch) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_broadcasts')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('firm_id', firmId)
    .select()
    .single();
  if (error) throw error;
  return mapBroadcast(data);
}

async function deleteBroadcast(id, firmId) {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from('firm_broadcasts').delete().eq('id', id).eq('firm_id', firmId);
  if (error) throw error;
}

async function listPublishedForClient(firmId, clientId, { category, search, limit = 40 } = {}) {
  const sb = getSupabaseAdmin();
  const now = new Date().toISOString();
  let q = sb
    .from('firm_broadcasts')
    .select('*')
    .eq('firm_id', firmId)
    .eq('status', 'PUBLISHED')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('pinned', { ascending: false })
    .order('priority', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);
  if (category) q = q.eq('category', category);
  if (search) {
    const orFilter = buildIlikeOrFilter(['title', 'excerpt'], search);
    if (orFilter) q = q.or(orFilter);
  }
  const { data, error } = await q;
  if (error) throw error;

  const ids = (data || []).map((r) => r.id);
  let readsByBroadcast = new Map();
  if (ids.length) {
    const { data: reads } = await sb
      .from('firm_broadcast_reads')
      .select('broadcast_id, read_at, acknowledged_at')
      .eq('client_id', clientId)
      .in('broadcast_id', ids);
    for (const r of reads || []) {
      readsByBroadcast.set(r.broadcast_id, r);
    }
  }

  const PRIORITY_ORDER = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

  return (data || [])
    .filter((row) => {
      if (row.target_type === 'SELECTED') {
        const targets = row.target_client_ids || [];
        return targets.includes(clientId);
      }
      return true;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const pa = PRIORITY_ORDER[a.priority] ?? 9;
      const pb = PRIORITY_ORDER[b.priority] ?? 9;
      if (pa !== pb) return pa - pb;
      return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
    })
    .map((row) => {
      const read = readsByBroadcast.get(row.id);
      return {
        ...mapBroadcast(row),
        readAt: read?.read_at || null,
        acknowledgedAt: read?.acknowledged_at || null,
        isRead: Boolean(read?.read_at),
        needsAck: row.read_confirmation_required && !read?.acknowledged_at,
      };
    });
}

async function bulkInsertReads(rows) {
  if (!rows.length) return;
  const sb = getSupabaseAdmin();
  const { error } = await sb.from('firm_broadcast_reads').upsert(rows, {
    onConflict: 'broadcast_id,client_id',
    ignoreDuplicates: true,
  });
  if (error) throw error;
}

async function bulkInsertNotifications(rows) {
  if (!rows.length) return;
  const sb = getSupabaseAdmin();
  const { error } = await sb.from('in_app_notifications').insert(rows);
  if (error) throw error;
}

async function getReadRow(broadcastId, clientId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_broadcast_reads')
    .select('*')
    .eq('broadcast_id', broadcastId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function markRead(broadcastId, clientId, { acknowledged = false } = {}) {
  const sb = getSupabaseAdmin();
  const now = new Date().toISOString();
  const patch = { read_at: now };
  if (acknowledged) patch.acknowledged_at = now;
  const { data, error } = await sb
    .from('firm_broadcast_reads')
    .update(patch)
    .eq('broadcast_id', broadcastId)
    .eq('client_id', clientId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function incrementBroadcastCounters(broadcastId, { readDelta = 0, ackDelta = 0 }) {
  if (!readDelta && !ackDelta) return;
  const sb = getSupabaseAdmin();
  const { data: current } = await sb.from('firm_broadcasts').select('read_count, ack_count').eq('id', broadcastId).single();
  if (!current) return;
  const patch = {};
  if (readDelta) patch.read_count = (current.read_count || 0) + readDelta;
  if (ackDelta) patch.ack_count = (current.ack_count || 0) + ackDelta;
  await sb.from('firm_broadcasts').update(patch).eq('id', broadcastId);
}

async function listReadsForAnalytics(broadcastId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_broadcast_reads')
    .select('client_id, read_at, acknowledged_at, created_at')
    .eq('broadcast_id', broadcastId);
  if (error) throw error;
  return data || [];
}

async function countUnreadForClient(firmId, clientId) {
  const sb = getSupabaseAdmin();
  const { data: broadcasts } = await sb
    .from('firm_broadcasts')
    .select('id, target_type, target_client_ids, read_confirmation_required')
    .eq('firm_id', firmId)
    .eq('status', 'PUBLISHED');
  if (!broadcasts?.length) return 0;

  const ids = broadcasts.map((b) => b.id);
  const { data: reads } = await sb
    .from('firm_broadcast_reads')
    .select('broadcast_id, read_at, acknowledged_at')
    .eq('client_id', clientId)
    .in('broadcast_id', ids);

  const readMap = new Map((reads || []).map((r) => [r.broadcast_id, r]));
  let unread = 0;
  for (const b of broadcasts) {
    if (b.target_type === 'SELECTED' && !(b.target_client_ids || []).includes(clientId)) continue;
    const r = readMap.get(b.id);
    if (!r?.read_at) unread += 1;
    else if (b.read_confirmation_required && !r.acknowledged_at) unread += 1;
  }
  return unread;
}

module.exports = {
  mapBroadcast,
  listBroadcasts,
  findById,
  findBySlug,
  insertBroadcast,
  updateBroadcast,
  deleteBroadcast,
  listPublishedForClient,
  bulkInsertReads,
  bulkInsertNotifications,
  getReadRow,
  markRead,
  incrementBroadcastCounters,
  listReadsForAnalytics,
  countUnreadForClient,
};
