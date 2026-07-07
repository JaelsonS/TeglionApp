const { getSupabaseAdmin } = require('../client');
const { safeDecryptText } = require('../../../utils/safe-display-text');
const conversationsRepository = require('./conversations.repository');

/** Mensagens = comunicação pura. Sem workflow de pedidos ou tarefas. */
function mapMessage(row) {
  if (!row) return null;
  const readAt = row.read_at || null;
  return {
    id: row.id,
    _id: row.id,
    conversationId: row.conversation_id,
    firmId: row.firm_id,
    clientId: row.client_id,
    senderType: row.sender_role,
    senderRole: row.sender_role,
    senderId: row.sender_id,
    content: safeDecryptText(row.body),
    body: safeDecryptText(row.body),
    readAt,
    isRead: Boolean(row.is_read ?? readAt),
    quickReplyKey: row.quick_reply_key,
    attachmentStorageKey: row.attachment_storage_key,
    attachmentName: row.attachment_name,
    attachmentMime: row.attachment_mime,
    editedAt: row.edited_at || null,
    createdAt: row.created_at,
  };
}

async function listMessages({ firmId, clientId, conversationId, limit = 100, since }) {
  const sb = getSupabaseAdmin();
  let q = sb.from('messages').select('*').order('created_at', { ascending: true }).limit(limit);
  if (conversationId) {
    q = q.eq('conversation_id', conversationId);
  } else {
    q = q.eq('firm_id', firmId).eq('client_id', clientId);
  }
  if (since) q = q.gt('created_at', since);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapMessage);
}

async function listRecentThreads(firmId, { limit = 50 } = {}) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('messages')
    .select('client_id, body, created_at, sender_role, read_at, is_read')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
    .limit(150);
  if (error) throw error;
  const byClient = new Map();
  for (const row of data || []) {
    if (!byClient.has(row.client_id)) {
      byClient.set(row.client_id, {
        clientId: row.client_id,
        lastBody: row.body,
        lastAt: row.created_at,
        lastSenderRole: row.sender_role,
        unread: false,
        unreadCount: 0,
      });
    }
    const entry = byClient.get(row.client_id);
    if (row.sender_role === 'CLIENT' && !row.read_at) {
      entry.unread = true;
      entry.unreadCount += 1;
    }
  }
  return Array.from(byClient.values()).slice(0, limit);
}

async function countUnreadForFirm(firmId) {
  const sb = getSupabaseAdmin();
  const { count, error } = await sb
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('firm_id', firmId)
    .eq('sender_role', 'CLIENT')
    .is('read_at', null);
  if (error) throw error;
  return count || 0;
}

async function countUnreadForClient(firmId, clientId) {
  const sb = getSupabaseAdmin();
  const { count, error } = await sb
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('sender_role', 'FIRM')
    .is('read_at', null);
  if (error) throw error;
  return count || 0;
}

async function createMessage({
  firmId,
  clientId,
  conversationId,
  senderRole,
  senderId,
  body,
  quickReplyKey,
  attachmentStorageKey,
  attachmentName,
  attachmentMime,
  attachmentSizeBytes,
}) {
  const sb = getSupabaseAdmin();
  let resolvedConversationId = conversationId;
  if (!resolvedConversationId) {
    const conversation = await conversationsRepository.getOrCreate({ firmId, clientId });
    resolvedConversationId = conversation.id;
  }
  const { data, error } = await sb
    .from('messages')
    .insert({
      firm_id: firmId,
      client_id: clientId,
      conversation_id: resolvedConversationId,
      sender_role: senderRole,
      sender_id: senderId,
      body: String(body).trim(),
      is_read: false,
      quick_reply_key: quickReplyKey || null,
      attachment_storage_key: attachmentStorageKey || null,
      attachment_name: attachmentName || null,
      attachment_mime: attachmentMime || null,
      attachment_size_bytes: attachmentSizeBytes || null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapMessage(data);
}

async function updateMessage({ messageId, firmId, clientId, senderRole, senderId, body }) {
  const sb = getSupabaseAdmin();
  const payload = {
    body: String(body || '').trim(),
    edited_at: new Date().toISOString(),
  };
  const { data, error } = await sb
    .from('messages')
    .update(payload)
    .eq('id', messageId)
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('sender_role', senderRole)
    .eq('sender_id', senderId)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data ? mapMessage(data) : null;
}

async function markClientMessagesRead(firmId, clientId) {
  const sb = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await sb
    .from('messages')
    .update({ read_at: now, is_read: true })
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('sender_role', 'CLIENT')
    .is('read_at', null);
  if (error) throw error;
}

async function markFirmMessagesRead(firmId, clientId) {
  const sb = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await sb
    .from('messages')
    .update({ read_at: now, is_read: true })
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('sender_role', 'FIRM')
    .is('read_at', null);
  if (error) throw error;
}

async function findMessageById(messageId, firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMessage(data) : null;
}

async function getAvgFirmResponseHours(firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('messages')
    .select('client_id, sender_role, created_at')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: true })
    .limit(600);
  if (error) throw error;
  const deltas = [];
  let pendingClientAt = null;
  let currentClient = null;
  for (const m of data || []) {
    if (m.client_id !== currentClient) {
      currentClient = m.client_id;
      pendingClientAt = null;
    }
    if (m.sender_role === 'CLIENT') {
      pendingClientAt = new Date(m.created_at).getTime();
    } else if (m.sender_role === 'FIRM' && pendingClientAt) {
      deltas.push((new Date(m.created_at).getTime() - pendingClientAt) / 3600000);
      pendingClientAt = null;
    }
  }
  if (!deltas.length) return null;
  return Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10;
}

module.exports = {
  listMessages,
  listRecentThreads,
  createMessage,
  updateMessage,
  markClientMessagesRead,
  markFirmMessagesRead,
  findMessageById,
  countUnreadForFirm,
  countUnreadForClient,
  getAvgFirmResponseHours,
};
