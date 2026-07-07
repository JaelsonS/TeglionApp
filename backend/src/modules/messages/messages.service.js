const { AppError } = require('../../middlewares/error.middleware');
const messagesRepository = require('../../db/supabase/repositories/messages.repository');
const conversationsRepository = require('../../db/supabase/repositories/conversations.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const documentRequestsService = require('../document-requests/document-requests.service');
const { getRepository } = require('../../db/supabase/repositories');
const activityService = require('../../services/activity/activity.service');
const contabilStorage = require('../../services/storage/contabil-storage.service');
const tasksWorkspace = require('../tasks/tasks-workspace.service');

const QUICK_REPLIES = {
  ok_received: 'Ok, recebido.',
  send_document: 'Favor enviar o documento em falta.',
  in_review: 'Em análise. Entraremos em contacto em breve.',
};

async function listThreads({ firmId }) {
  const threads = await messagesRepository.listRecentThreads(firmId);
  const clientIds = threads.map((t) => t.clientId);
  const clients =
    clientIds.length > 0 ? await clientsRepository.findClientsByIds(firmId, clientIds) : [];
  const byId = new Map(clients.map((c) => [c.id, c]));
  return threads.map((t) => ({
    ...t,
    clientName: byId.get(t.clientId)?.displayName || 'Cliente',
    unreadCount: t.unreadCount || (t.unread ? 1 : 0),
  }));
}

async function getUnreadSummary({ firmId }) {
  const total = await messagesRepository.countUnreadForFirm(firmId);
  const threads = await messagesRepository.listRecentThreads(firmId);
  const withUnread = threads.filter((t) => t.unread).length;
  return { total, threadsWithUnread: withUnread };
}

async function listMessages({ firmId, clientId }) {
  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404);
  const conversation = await conversationsRepository.getOrCreate({ firmId, clientId });
  const [items, documentRequests] = await Promise.all([
    messagesRepository.listMessages({ firmId, clientId, conversationId: conversation.id }),
    documentRequestsService.listByClient({ firmId, clientId }),
  ]);
  await messagesRepository.markClientMessagesRead(firmId, clientId);
  return { items, documentRequests: documentRequests.items, client, conversationId: conversation.id };
}

async function sendFirmMessage({
  firmId,
  clientId,
  senderId,
  body,
  isDocumentRequest,
  obligationId,
  periodMonth,
  quickReplyKey,
  file,
}) {
  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404);
  const text = quickReplyKey ? QUICK_REPLIES[quickReplyKey] || body : body;
  if ((!text || !String(text).trim()) && !file) throw new AppError('Mensagem vazia', 400);

  const conversation = await conversationsRepository.getOrCreate({ firmId, clientId });

  let attachment = null;
  if (file) {
    const uploaded = await contabilStorage.uploadClientDocument({ firmId, clientId, file });
    attachment = {
      storageKey: uploaded.path,
      name: file.originalname,
      mime: file.mimetype,
      size: file.size,
    };
  }

  const message = await messagesRepository.createMessage({
    firmId,
    clientId,
    conversationId: conversation.id,
    senderRole: 'FIRM',
    senderId,
    body: String(text || file?.originalname || 'Anexo').trim(),
    quickReplyKey: quickReplyKey || null,
    attachmentStorageKey: attachment?.storageKey,
    attachmentName: attachment?.name,
    attachmentMime: attachment?.mime,
    attachmentSizeBytes: attachment?.size,
  });

  let documentRequest = null;
  if (isDocumentRequest || quickReplyKey === 'send_document') {
    const created = await documentRequestsService.createFromMessage({
      firmId,
      messageId: message.id,
      message,
      actorId: senderId,
      obligationId,
      periodMonth,
    });
    documentRequest = created.request;
  }

  await tasksWorkspace.notifyClientInApp({
    firmId,
    clientId,
    type: 'MESSAGE',
    title: documentRequest ? 'Novo pedido de documento' : 'Nova mensagem do escritório',
    body: String(text || 'Anexo').trim().slice(0, 120),
    entityType: 'MESSAGE',
    entityId: message.id,
    actionUrl: documentRequest ? '/app/client/requests' : '/app/client/messages',
  });

  void activityService.recordActivity({
    firmId,
    clientId,
    actorRole: 'FIRM',
    actorId: senderId,
    eventType: 'MESSAGE_SENT',
    entityType: 'MESSAGE',
    entityId: message.id,
    title: 'Mensagem enviada ao cliente',
    metadata: { preview: String(text).trim().slice(0, 120) },
  });

  return { message, documentRequest };
}

async function editFirmMessage({
  firmId,
  clientId,
  senderId,
  messageId,
  body,
}) {
  const nextBody = String(body || '').trim();
  if (nextBody.length < 1) throw new AppError('Mensagem vazia', 400);
  if (nextBody.length > 5000) throw new AppError('Mensagem excede 5000 caracteres', 400);

  const updated = await messagesRepository.updateMessage({
    messageId,
    firmId,
    clientId,
    senderRole: 'FIRM',
    senderId,
    body: nextBody,
  });

  if (!updated) throw new AppError('Mensagem não encontrada', 404);
  return updated;
}

async function editClientMessage({
  firmId,
  clientId,
  senderId,
  messageId,
  body,
}) {
  const nextBody = String(body || '').trim();
  if (nextBody.length < 1) throw new AppError('Mensagem vazia', 400);
  if (nextBody.length > 5000) throw new AppError('Mensagem excede 5000 caracteres', 400);

  const updated = await messagesRepository.updateMessage({
    messageId,
    firmId,
    clientId,
    senderRole: 'CLIENT',
    senderId,
    body: nextBody,
  });

  if (!updated) throw new AppError('Mensagem não encontrada', 404);
  return updated;
}

async function sendClientMessage({ actor, body, quickReplyKey, file }) {
  if (!actor || actor.role !== 'CLIENT') throw new AppError('Acesso negado', 403);
  const clientId = actor.clientId || actor.id;
  const firmId = actor.firmId;
  const text = quickReplyKey ? QUICK_REPLIES[quickReplyKey] || body : body;
  if ((!text || !String(text).trim()) && !file) throw new AppError('Mensagem vazia', 400);

  const conversation = await conversationsRepository.getOrCreate({ firmId, clientId });

  let attachment = null;
  if (file) {
    const uploaded = await contabilStorage.uploadClientDocument({ firmId, clientId, file });
    attachment = {
      storageKey: uploaded.path,
      name: file.originalname,
      mime: file.mimetype,
      size: file.size,
    };
  }

  const message = await messagesRepository.createMessage({
    firmId,
    clientId,
    conversationId: conversation.id,
    senderRole: 'CLIENT',
    senderId: clientId,
    body: String(text || file?.originalname || 'Anexo').trim(),
    quickReplyKey: quickReplyKey || null,
    attachmentStorageKey: attachment?.storageKey,
    attachmentName: attachment?.name,
    attachmentMime: attachment?.mime,
    attachmentSizeBytes: attachment?.size,
  });

  await tasksWorkspace.notifyFirmStaff({
    firmId,
    category: 'MESSAGE',
    type: 'MESSAGE_NEW',
    title: 'Nova mensagem do cliente',
    body: String(text || 'Anexo').trim().slice(0, 120),
    entityType: 'MESSAGE',
    entityId: message.id,
    actionUrl: `/app/firm/documents/requests?client=${clientId}`,
  });

  void activityService.recordActivity({
    firmId,
    clientId,
    actorRole: 'CLIENT',
    actorId: clientId,
    eventType: 'MESSAGE_SENT',
    entityType: 'MESSAGE',
    entityId: message.id,
    title: 'Mensagem enviada pelo cliente',
    metadata: { preview: String(text).trim().slice(0, 120) },
  });

  return { message };
}

async function notifyCriticalObligations({ firmId, actorId }) {
  const repo = getRepository();
  const dashboard = await repo.getFirmDashboardStats(firmId);
  const items = dashboard.criticalNext48h || [];
  let sent = 0;
  for (const ob of items) {
    const label = ob.title || ob.type;
    await sendFirmMessage({
      firmId,
      clientId: ob.clientId,
      senderId: actorId,
      body: `Lembrete: a obrigação «${label}» vence em breve (${ob.dueDate}). Por favor confirme documentos ou contacte o escritório.`,
      isDocumentRequest: true,
      obligationId: ob.id || ob._id,
      periodMonth: ob.period ? String(ob.period).slice(0, 7) : undefined,
    });
    sent += 1;
  }
  return { notified: sent };
}

async function notifyInactiveClients({ firmId, actorId }) {
  const dashboard = await getRepository().getFirmDashboardStats(firmId);
  let sent = 0;
  for (const c of dashboard.inactiveClients || []) {
    await sendFirmMessage({
      firmId,
      clientId: c.id,
      senderId: actorId,
      body: 'Olá! Há documentos ou obrigações pendentes no portal. Entre quando puder — demora menos de 2 minutos.',
    });
    sent += 1;
  }
  return { notified: sent };
}

async function convertToDocumentRequest({ firmId, messageId, actorId, obligationId, periodMonth }) {
  const msg = await messagesRepository.findMessageById(messageId, firmId);
  if (!msg) throw new AppError('Mensagem não encontrada', 404);
  if (msg.senderType !== 'FIRM' && msg.senderRole !== 'FIRM') {
    throw new AppError('Só mensagens do escritório podem virar pedido', 400);
  }
  return documentRequestsService.createFromMessage({
    firmId,
    messageId,
    message: msg,
    actorId,
    obligationId,
    periodMonth,
  });
}

module.exports = {
  listThreads,
  listMessages,
  getUnreadSummary,
  sendFirmMessage,
  editFirmMessage,
  editClientMessage,
  sendClientMessage,
  convertToDocumentRequest,
  notifyCriticalObligations,
  notifyInactiveClients,
  QUICK_REPLIES,
};
