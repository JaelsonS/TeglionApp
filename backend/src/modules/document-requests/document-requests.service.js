const { AppError } = require('../../middlewares/error.middleware');
const documentRequestsRepo = require('../../db/supabase/repositories/document-requests.repository');
const conversationsRepo = require('../../db/supabase/repositories/conversations.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const taskEventService = require('../tasks/task-event.service');
const activityService = require('../../services/activity/activity.service');

function currentPeriodMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function createRequest({
  firmId,
  clientId,
  messageId,
  obligationId,
  periodMonth,
  title,
  instructions,
  createdBy,
}) {
  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404);
  const conversation = await conversationsRepo.getOrCreate({ firmId, clientId });

  const request = await documentRequestsRepo.create({
    firmId,
    clientId,
    conversationId: conversation.id,
    messageId,
    obligationId,
    periodMonth: periodMonth || currentPeriodMonth(),
    title,
    instructions,
    createdBy,
  });

  void activityService.recordActivity({
    firmId,
    clientId,
    actorRole: 'FIRM',
    actorId: createdBy,
    eventType: 'DOCUMENT_REQUEST_CREATED',
    entityType: 'DOCUMENT_REQUEST',
    entityId: request.id,
    title: title || 'Pedido de documento',
    metadata: { messageId },
  }).catch(() => {});

  return { request };
}

async function createFromMessage({ firmId, messageId, message, actorId, obligationId, periodMonth }) {
  return createRequest({
    firmId,
    clientId: message.clientId,
    messageId,
    obligationId: obligationId || message.obligationId || null,
    periodMonth,
    title: 'Pedido de documento',
    instructions: message.body,
    createdBy: actorId,
  });
}

async function listByClient({ firmId, clientId }) {
  const items = await documentRequestsRepo.listByClient({ firmId, clientId });
  return { items };
}

async function markSeenForClient({ firmId, clientId }) {
  const updated = await documentRequestsRepo.markPendingAsSeenForClient({ firmId, clientId });
  for (const request of updated) {
    await taskEventService.emit(taskEventService.EVENT_TYPES.DOCUMENT_REQUEST_SEEN, {
      firmId,
      request,
    });
  }
  return { updated: updated.length };
}

async function markAnsweredForClient({ firmId, clientId, documentId }) {
  const updated = await documentRequestsRepo.markOpenAsAnswered({ firmId, clientId, documentId });
  return { updated: updated.length };
}

async function markSeenById({ firmId, clientId, requestId }) {
  const existing = await documentRequestsRepo.findById(requestId, firmId);
  if (!existing || existing.clientId !== clientId) {
    throw new AppError('Pedido não encontrado', 404);
  }
  if (existing.status !== 'pending' || existing.seenAt) {
    return { request: existing };
  }
  const now = new Date().toISOString();
  const request = await documentRequestsRepo.updateStatus(requestId, firmId, {
    status: 'seen',
    seenAt: now,
  });
  await taskEventService.emit(taskEventService.EVENT_TYPES.DOCUMENT_REQUEST_SEEN, {
    firmId,
    request,
  });
  return { request };
}

async function answerWithDocument({ firmId, clientId, requestId, documentId }) {
  const existing = await documentRequestsRepo.findById(requestId, firmId);
  if (!existing || existing.clientId !== clientId) {
    throw new AppError('Pedido não encontrado', 404);
  }
  const now = new Date().toISOString();
  const request = await documentRequestsRepo.updateStatus(requestId, firmId, {
    status: 'answered',
    answeredAt: now,
    documentId,
  });
  return { request };
}

async function completeRequest({ firmId, requestId }) {
  const existing = await documentRequestsRepo.findById(requestId, firmId);
  if (!existing) throw new AppError('Pedido não encontrado', 404);
  const now = new Date().toISOString();
  const request = await documentRequestsRepo.updateStatus(requestId, firmId, {
    status: 'completed',
    completedAt: now,
  });
  await taskEventService.emit(taskEventService.EVENT_TYPES.DOCUMENT_REQUEST_COMPLETED, {
    firmId,
    request,
  });
  return { request };
}

module.exports = {
  createRequest,
  createFromMessage,
  listByClient,
  markSeenForClient,
  markSeenById,
  markAnsweredForClient,
  answerWithDocument,
  completeRequest,
};
