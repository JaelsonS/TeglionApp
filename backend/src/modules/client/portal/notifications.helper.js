/**
 * Notificações in-app do portal cliente.
 */
const { requireLinkedClient } = require('./client.guard');
const clientPortalNotify = require('../../../services/notifications/client-portal-notify.service');

async function createInAppNotification(params) {
  await clientPortalNotify.notifyClientPortal(params);
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
      actionUrl: n.action_url || clientPortalNotify.resolveDefaultClientActionUrl(n.entity_type, n.type),
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
