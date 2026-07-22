const { getSupabaseAdmin } = require('../../db/supabase/client');
const pushService = require('../../modules/push/push.service');

function resolveDefaultClientActionUrl(entityType, type) {
  const e = String(entityType || '').toUpperCase();
  const t = String(type || '').toUpperCase();
  if (e === 'MESSAGE' || t === 'MESSAGE') return '/app/client/messages';
  if (e === 'DOCUMENT' || t.includes('DOCUMENT')) return '/app/client/documents';
  if (e === 'OBLIGATION' || t.includes('OBLIGATION')) return '/app/client/agenda';
  if (e === 'BROADCAST' || t === 'BROADCAST') return '/app/client/updates';
  if (e === 'CLIENT_TASK' || t.includes('TASK') || t.includes('REQUEST')) return '/app/client/requests';
  return '/app/client';
}

/**
 * Notificação in-app + push Web para o portal do cliente.
 */
async function notifyClientPortal({
  firmId,
  clientId,
  category,
  type,
  title,
  body,
  entityType,
  entityId,
  actionUrl,
  skipPush = false,
  skipInApp = false,
}) {
  const sb = getSupabaseAdmin();
  if (!sb || !firmId || !clientId) return;

  const nextEntityType = entityType || 'CLIENT_TASK';
  const url = actionUrl || resolveDefaultClientActionUrl(nextEntityType, type);

  if (!skipInApp) {
    const { error } = await sb.from('in_app_notifications').insert({
      firm_id: firmId,
      client_id: clientId,
      category: category || nextEntityType || type || 'GENERAL',
      type,
      title,
      body: body || null,
      entity_type: nextEntityType,
      entity_id: entityId,
      action_url: url,
    });
    if (error) {
      console.warn('[client-portal-notify] in_app:', error.message);
    }
  }

  if (!skipPush && title) {
    void pushService
      .sendPushToUser({
        firmId,
        userId: clientId,
        userRole: 'CLIENT',
        title,
        body: body || '',
        url,
      })
      .catch((err) => {
        console.warn('[client-portal-notify] push:', err?.message);
      });
  }
}

module.exports = { notifyClientPortal, resolveDefaultClientActionUrl };
