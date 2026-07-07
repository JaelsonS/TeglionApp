const { getSupabaseAdmin } = require('../../db/supabase/client');
const messagesRepository = require('../../db/supabase/repositories/messages.repository');

function defaultSince() {
  return new Date(Date.now() - 30_000).toISOString();
}

async function pollFirmEvents({ firmId, firmUserId, since }) {
  const sb = getSupabaseAdmin();
  const sinceIso = since || defaultSince();
  const events = [];

  const { data: newMessages, error: msgErr } = await sb
    .from('messages')
    .select('id, client_id, created_at')
    .eq('firm_id', firmId)
    .eq('sender_role', 'CLIENT')
    .gt('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(20);
  if (msgErr) throw msgErr;
  if (newMessages?.length) {
    events.push({
      type: 'MESSAGES_NEW',
      category: 'MESSAGE',
      count: newMessages.length,
      clientIds: [...new Set(newMessages.map((m) => m.client_id))],
    });
  }

  const { data: notifs, error: nErr } = await sb
    .from('firm_notifications')
    .select('id, category, type, title, entity_id, created_at')
    .eq('firm_id', firmId)
    .or(`firm_user_id.is.null,firm_user_id.eq.${firmUserId}`)
    .gt('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(15);
  if (nErr) throw nErr;
  for (const n of notifs || []) {
    events.push({
      type: 'FIRM_NOTIFICATION',
      category: n.category,
      id: n.id,
      title: n.title,
      entityId: n.entity_id,
      createdAt: n.created_at,
    });
  }

  const { data: tasks, error: tErr } = await sb
    .from('client_tasks')
    .select('id, title, help_requested_at, updated_at')
    .eq('firm_id', firmId)
    .gt('updated_at', sinceIso)
    .not('help_requested_at', 'is', null)
    .limit(10);
  if (tErr) throw tErr;
  if (tasks?.length) {
    events.push({
      type: 'TASK_HELP',
      category: 'TASK',
      count: tasks.length,
    });
  }

  const unreadMessages = await messagesRepository.countUnreadForFirm(firmId);
  const { count: unreadNotifs } = await sb
    .from('firm_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('firm_id', firmId)
    .or(`firm_user_id.is.null,firm_user_id.eq.${firmUserId}`)
    .is('read_at', null);

  return {
    events,
    cursor: new Date().toISOString(),
    badge: {
      messages: unreadMessages,
      notifications: unreadNotifs || 0,
      total: unreadMessages + (unreadNotifs || 0),
    },
  };
}

async function pollClientEvents({ firmId, clientId, since }) {
  const sb = getSupabaseAdmin();
  const sinceIso = since || defaultSince();
  const events = [];

  const { data: newMessages, error: msgErr } = await sb
    .from('messages')
    .select('id, created_at')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('sender_role', 'FIRM')
    .gt('created_at', sinceIso)
    .limit(20);
  if (msgErr) throw msgErr;
  if (newMessages?.length) {
    events.push({ type: 'MESSAGES_NEW', category: 'MESSAGE', count: newMessages.length });
  }

  const { data: notifs, error: nErr } = await sb
    .from('in_app_notifications')
    .select('id, type, title, entity_id, created_at')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .gt('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(15);
  if (nErr) throw nErr;
  for (const n of notifs || []) {
    events.push({
      type: 'CLIENT_NOTIFICATION',
      category: n.type === 'BROADCAST' ? 'ALERT' : n.type,
      id: n.id,
      title: n.title,
      entityId: n.entity_id,
      createdAt: n.created_at,
    });
  }

  const unreadMessages = await messagesRepository.countUnreadForClient(firmId, clientId);
  const { count: unreadNotifs } = await sb
    .from('in_app_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .is('read_at', null);

  return {
    events,
    cursor: new Date().toISOString(),
    badge: {
      messages: unreadMessages,
      notifications: unreadNotifs || 0,
      total: unreadMessages + (unreadNotifs || 0),
    },
  };
}

module.exports = { pollFirmEvents, pollClientEvents };
