/**
 * Única camada que altera tasks em resposta a eventos de outros módulos.
 * Tasks nunca são atualizadas diretamente por messages, document_requests ou documents.
 */
const tasksRepo = require('../../db/supabase/repositories/tasks.repository');
const documentRequestsRepo = require('../../db/supabase/repositories/document-requests.repository');
const activityService = require('../../services/activity/activity.service');

const EVENT_TYPES = {
  DOCUMENT_REQUEST_SEEN: 'document_request_seen',
  DOCUMENT_REQUEST_COMPLETED: 'document_request_completed',
  DOCUMENT_APPROVED: 'document_approved',
  DOCUMENT_REJECTED: 'document_rejected',
};

async function resolveTaskForContext({ firmId, obligationId, periodMonth, clientId }) {
  if (obligationId && periodMonth) {
    const byRule = await tasksRepo.findTaskByObligationPeriod(firmId, obligationId, periodMonth);
    if (byRule) return byRule;
  }
  if (obligationId) {
    return tasksRepo.findOpenTaskForObligation(firmId, obligationId);
  }
  if (clientId && periodMonth) {
    return tasksRepo.findOpenRecurringTaskForClientMonth(firmId, clientId, periodMonth);
  }
  return null;
}

async function completeTask({ firmId, task, reason, metadata = {} }) {
  if (!task || task.status === 'DONE' || task.status === 'ARCHIVED') return null;
  const updated = await tasksRepo.updateTask(task.id, firmId, {
    status: 'DONE',
    completedAt: new Date().toISOString(),
  });
  void activityService.recordActivity({
    firmId,
    clientId: task.clientId,
    actorRole: 'SYSTEM',
    actorId: null,
    eventType: 'TASK_AUTO_COMPLETED',
    entityType: 'CLIENT_TASK',
    entityId: task.id,
    title: 'Tarefa concluída por evento',
    metadata: { reason, ...metadata },
  }).catch(() => {});
  return updated;
}

async function markTaskWaitingClient({ firmId, task, reason }) {
  if (!task || ['DONE', 'ARCHIVED', 'WAITING_CLIENT'].includes(task.status)) return null;
  return tasksRepo.updateTask(task.id, firmId, { status: 'WAITING_CLIENT' });
}

async function handleDocumentRequestSeen({ firmId, request }) {
  const task = await resolveTaskForContext({
    firmId,
    obligationId: request.obligationId,
    periodMonth: request.periodMonth,
    clientId: request.clientId,
  });
  if (task) {
    await markTaskWaitingClient({ firmId, task, reason: EVENT_TYPES.DOCUMENT_REQUEST_SEEN });
  }
  return { taskId: task?.id || null };
}

async function handleDocumentRequestCompleted({ firmId, request }) {
  const task = await resolveTaskForContext({
    firmId,
    obligationId: request.obligationId,
    periodMonth: request.periodMonth,
    clientId: request.clientId,
  });
  if (task) {
    await completeTask({
      firmId,
      task,
      reason: EVENT_TYPES.DOCUMENT_REQUEST_COMPLETED,
      metadata: { documentRequestId: request.id },
    });
  }
  return { taskId: task?.id || null };
}

async function handleDocumentApproved({ firmId, document }) {
  const completedRequests = await documentRequestsRepo.completeByDocumentId(firmId, document.id);
  for (const request of completedRequests) {
    await handleDocumentRequestCompleted({ firmId, request });
  }

  let task = null;
  if (document.clientTaskId) {
    task = await tasksRepo.findTaskById(firmId, document.clientTaskId);
  }
  if (!task) {
    task = await resolveTaskForContext({
      firmId,
      obligationId: document.obligationId,
      periodMonth: document.period ? String(document.period).slice(0, 7) : null,
      clientId: document.clientId,
    });
  }
  if (task) {
    await completeTask({
      firmId,
      task,
      reason: EVENT_TYPES.DOCUMENT_APPROVED,
      metadata: { documentId: document.id },
    });
  }
  return { taskId: task?.id || null };
}

async function handleDocumentRejected({ firmId, document }) {
  const task = await resolveTaskForContext({
    firmId,
    obligationId: document.obligationId,
    periodMonth: document.period ? String(document.period).slice(0, 7) : null,
    clientId: document.clientId,
  });
  if (task) {
    await markTaskWaitingClient({ firmId, task, reason: EVENT_TYPES.DOCUMENT_REJECTED });
  }
  return { taskId: task?.id || null };
}

async function emit(eventType, payload) {
  const { firmId } = payload;
  if (!firmId) return null;
  switch (eventType) {
    case EVENT_TYPES.DOCUMENT_REQUEST_SEEN:
      return handleDocumentRequestSeen({ firmId, request: payload.request });
    case EVENT_TYPES.DOCUMENT_REQUEST_COMPLETED:
      return handleDocumentRequestCompleted({ firmId, request: payload.request });
    case EVENT_TYPES.DOCUMENT_APPROVED:
      return handleDocumentApproved({ firmId, document: payload.document });
    case EVENT_TYPES.DOCUMENT_REJECTED:
      return handleDocumentRejected({ firmId, document: payload.document });
    default:
      return null;
  }
}

module.exports = {
  EVENT_TYPES,
  emit,
  handleDocumentRequestSeen,
  handleDocumentRequestCompleted,
  handleDocumentApproved,
  handleDocumentRejected,
};
