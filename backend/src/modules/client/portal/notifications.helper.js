/**
 * Notificações in-app do portal cliente.
 */
const { requireLinkedClient } = require('./client.guard');

function resolveDefaultActionUrl(entityType, type) {
  const e = String(entityType || '').toUpperCase();
  const t = String(type || '').toUpperCase();
  if (e === 'MESSAGE' || t === 'MESSAGE') return '/app/client/messages';
  if (e === 'DOCUMENT' || t.includes('DOCUMENT')) return '/app/client/documents';
  if (e === 'OBLIGATION' || t.includes('OBLIGATION')) return '/app/client/agenda';
  if (e === 'CLIENT_TASK' || t.includes('TASK') || t.includes('REQUEST')) return '/app/client/requests';
  return '/app/client';
}

async function createInAppNotification({
  firmId,
  clientId,
  category,
  type,
  title,
  body,
  entityType,
  entityId,
  actionUrl,
}) {
  const sb = require('../../../db/supabase/client').getSupabaseAdmin();
  if (!sb) return;
  const { error } = await sb.from('in_app_notifications').insert({
    firm_id: firmId,
    client_id: clientId,
    category: category || entityType || type || 'GENERAL',
    type,
    title,
    body,
    entity_type: entityType,
    entity_id: entityId,
    action_url: actionUrl || resolveDefaultActionUrl(entityType, type),
  });
  if (error) console.warn('[portal] notification:', error.message);
}

async function listMyNotifications({ actor }) {
  const client = await requireLinkedClient(actor);
  const sb = require('../../../db/supabase/client').getSupabaseAdmin();
  if (!sb) return { items: [] };
  const { data } = await sb
    .from('in_app_notifications')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(30);
  return {
    items: (data || []).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      category: n.category || null,
      readAt: n.read_at,
      createdAt: n.created_at,
      entityType: n.entity_type,
      entityId: n.entity_id,
      actionUrl: n.action_url || resolveDefaultActionUrl(n.entity_type, n.type),
    })),
  };
}

async function markNotificationRead({ actor, notificationId }) {
  const client = await requireLinkedClient(actor);
  const sb = require('../../../db/supabase/client').getSupabaseAdmin();
  if (!sb) return { ok: true };
  const { error } = await sb
    .from('in_app_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('client_id', client.id);
  if (error) throw error;
  return { ok: true };
}

async function markAllNotificationsRead({ actor }) {
  const client = await requireLinkedClient(actor);
  const sb = require('../../../db/supabase/client').getSupabaseAdmin();
  if (!sb) return { ok: true };
  const { error } = await sb
    .from('in_app_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('client_id', client.id)
    .is('read_at', null);
  if (error) throw error;
  return { ok: true };
}

module.exports = {
  createInAppNotification,
  listMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
