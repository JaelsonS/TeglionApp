/**
 * Mensagens do portal cliente — extraído de portal.service.js.
 */
const messagesRepository = require('../../../db/supabase/repositories/messages.repository');
const messagesService = require('../../messages/messages.service');
const { requireLinkedClient } = require('./client.guard');

async function listMyMessages({ actor }) {
  const client = await requireLinkedClient(actor);
  const conversationsRepository = require('../../../db/supabase/repositories/conversations.repository');
  const conversation = await conversationsRepository.getOrCreate({
    firmId: client.firmId,
    clientId: client.id,
  });
  const items = await messagesRepository.listMessages({
    firmId: client.firmId,
    clientId: client.id,
    conversationId: conversation.id,
  });
  await messagesRepository.markFirmMessagesRead(client.firmId, client.id);
  return {
    items: items.map((m) =>
      m.senderRole === 'FIRM' && !m.readAt
        ? { ...m, readAt: new Date().toISOString(), isRead: true }
        : m,
    ),
  };
}

async function getMyMessagesUnreadCount({ actor }) {
  const client = await requireLinkedClient(actor);
  const total = await messagesRepository.countUnreadForClient(client.firmId, client.id);
  return { total };
}

async function sendMyMessage({ actor, body, quickReplyKey, file }) {
  return messagesService.sendClientMessage({
    actor,
    body,
    quickReplyKey,
    file,
  });
}

async function editMyMessage({ actor, messageId, body }) {
  const client = await requireLinkedClient(actor);
  const message = await messagesService.editClientMessage({
    firmId: client.firmId,
    clientId: client.id,
    senderId: client.id,
    messageId,
    body,
  });
  return { message };
}

module.exports = {
  listMyMessages,
  getMyMessagesUnreadCount,
  sendMyMessage,
  editMyMessage,
};
