const { getSupabaseAdmin } = require('../../db/supabase/client');

function mapRow(row) {
  return {
    id: row.id,
    category: row.category,
    type: row.type,
    title: row.title,
    body: row.body,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actionUrl: row.action_url,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

async function listForUser(firmId, firmUserId, { limit = 50, unreadOnly = false } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('firm_notifications')
    .select('*')
    .eq('firm_id', firmId)
    .or(`firm_user_id.is.null,firm_user_id.eq.${firmUserId}`)
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 100));

  if (unreadOnly) q = q.is('read_at', null);

  const { data, error } = await q;
  if (error) throw error;
  return { items: (data || []).map(mapRow), unreadCount: (data || []).filter((r) => !r.read_at).length };
}

async function markRead(firmId, notificationId, firmUserId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('firm_id', firmId)
    .or(`firm_user_id.is.null,firm_user_id.eq.${firmUserId}`)
    .select()
    .maybeSingle();
  if (error) throw error;
  return mapRow(data);
}

async function markAllRead(firmId, firmUserId) {
  const sb = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await sb
    .from('firm_notifications')
    .update({ read_at: now })
    .eq('firm_id', firmId)
    .or(`firm_user_id.is.null,firm_user_id.eq.${firmUserId}`)
    .is('read_at', null);
  if (error) throw error;
  return { ok: true };
}

module.exports = { listForUser, markRead, markAllRead };
