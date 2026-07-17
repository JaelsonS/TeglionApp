const { AppError } = require('../../middlewares/error.middleware');
const { getRepository } = require('../../db/supabase/repositories');
const activityService = require('../../services/activity/activity.service');
const messagesService = require('../messages/messages.service');
const taskEventService = require('../tasks/task-event.service');
const viewTracking = require('../../services/tracking/view-tracking.service');

async function validateDocument({ firmId, documentId, validationStatus, validatedBy }) {
  if (!['APPROVED', 'REJECTED', 'PENDING'].includes(validationStatus)) {
    throw new AppError('Estado de validação inválido', 400);
  }
  const repo = getRepository();
  const doc = await repo.validateDocument(documentId, firmId, {
    validationStatus,
    validatedBy,
  });
  if (!doc) throw new AppError('Documento não encontrado', 404);
  await repo.writeAuditLog({
    firmId,
    actorRole: 'FIRM',
    actorId: validatedBy,
    action: `document.${validationStatus.toLowerCase()}`,
    entityType: 'document',
    entityId: documentId,
    metadata: {},
  }).catch(() => {});
  void activityService.recordActivity({
    firmId,
    clientId: doc.clientId,
    actorRole: 'FIRM',
    actorId: validatedBy,
    eventType: `DOCUMENT_${validationStatus}`,
    entityType: 'DOCUMENT',
    entityId: documentId,
    title:
      validationStatus === 'APPROVED'
        ? 'Documento aprovado'
        : validationStatus === 'REJECTED'
          ? 'Documento rejeitado'
          : 'Documento pendente',
    description: doc.title,
  }).catch(() => {});

  if (validationStatus === 'APPROVED') {
    // completeByDocumentId + tarefa ligada vivem em task-event (DOCUMENT_APPROVED)
    await taskEventService.emit(taskEventService.EVENT_TYPES.DOCUMENT_APPROVED, { firmId, document: doc });
  } else if (validationStatus === 'REJECTED') {
    await taskEventService.emit(taskEventService.EVENT_TYPES.DOCUMENT_REJECTED, { firmId, document: doc });
  }

  return { document: doc };
}

async function getDocumentDetail({ firmId, documentId }) {
  const repo = getRepository();
  let document = await repo.findDocumentById(documentId, firmId);
  if (!document) throw new AppError('Documento não encontrado', 404);

  if (!document.clientName && document.clientId) {
    try {
      const clientsRepository = require('../../db/supabase/repositories/clients.repository');
      const client = await clientsRepository.findClientById(firmId, document.clientId);
      if (client) {
        document = {
          ...document,
          clientName: client.displayName || client.name,
          clientEmail: client.email,
          clientTaxId: client.taxId,
        };
      }
    } catch {
      /* optional */
    }
  }
  if (!document.obligationTitle && document.obligationId) {
    const ob = await repo.findObligationById(document.obligationId, firmId).catch(() => null);
    if (ob) {
      document = { ...document, obligationTitle: ob.title, obligationPeriod: ob.period };
    }
  }

  const [activity, auditLogs, views] = await Promise.all([
    activityService.listActivityForEntity({
      firmId,
      entityType: 'DOCUMENT',
      entityId: documentId,
      limit: 40,
    }),
    repo.listDocumentAuditLogs({ firmId, documentId, limit: 40 }),
    viewTracking.getViewStats({ firmId, entityType: 'DOCUMENT', entityId: documentId }).catch(() => null),
  ]);

  const history = [
    ...activity.map((a) => ({
      id: a.id,
      kind: 'activity',
      title: a.title,
      description: a.description,
      actorRole: a.actorRole,
      createdAt: a.createdAt,
    })),
    ...auditLogs.map((a) => ({
      id: a.id,
      kind: 'audit',
      title: auditActionLabel(a.action),
      description: null,
      actorRole: a.actorRole,
      createdAt: a.createdAt,
    })),
  ].sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime());

  return { document, history, views };
}

function auditActionLabel(action) {
  const map = {
    'document.approved': 'Validação: aprovado',
    'document.rejected': 'Validação: rejeitado',
    'document.pending': 'Validação: pendente',
  };
  return map[action] || action;
}

async function requestResend({ firmId, documentId, staffId, message }) {
  const repo = getRepository();
  const doc = await repo.findDocumentById(documentId, firmId);
  if (!doc) throw new AppError('Documento não encontrado', 404);

  const body =
    message?.trim() ||
    `Por favor reenvie o documento «${doc.title || 'documento'}»${doc.period ? ` (período ${doc.period})` : ''}. Obrigado.`;

  await messagesService.sendFirmMessage({
    firmId,
    clientId: doc.clientId,
    senderId: staffId,
    body,
    isDocumentRequest: true,
    obligationId: doc.obligationId || undefined,
    periodMonth: doc.period ? String(doc.period).slice(0, 7) : undefined,
  });

  await repo.validateDocument(documentId, firmId, {
    validationStatus: 'PENDING',
    validatedBy: staffId,
  });

  void activityService.recordActivity({
    firmId,
    clientId: doc.clientId,
    actorRole: 'FIRM',
    actorId: staffId,
    eventType: 'DOCUMENT_RESEND_REQUESTED',
    entityType: 'DOCUMENT',
    entityId: documentId,
    title: 'Reenvio solicitado ao cliente',
    description: body,
  }).catch(() => {});

  return { ok: true, message: body };
}

async function deleteDocument({ firmId, documentId, deletedBy }) {
  const repo = getRepository();
  const doc = await repo.findDocumentById(documentId, firmId);
  if (!doc) throw new AppError('Documento não encontrado', 404);

  const removed = await repo.softDeleteDocument(documentId, firmId);
  if (!removed) throw new AppError('Documento não encontrado', 404);

  await repo.writeAuditLog({
    firmId,
    actorRole: 'FIRM',
    actorId: deletedBy,
    action: 'document.deleted',
    entityType: 'document',
    entityId: documentId,
    metadata: {},
  }).catch(() => {});

  void activityService.recordActivity({
    firmId,
    clientId: doc.clientId,
    actorRole: 'FIRM',
    actorId: deletedBy,
    eventType: 'DOCUMENT_DELETED',
    entityType: 'DOCUMENT',
    entityId: documentId,
    title: 'Documento removido',
    description: doc.title,
  }).catch(() => {});

  return { ok: true };
}

async function checkDuplicate({ firmId, clientId, title, period }) {
  const repo = getRepository();
  const matches = await repo.findDuplicateDocument({
    firmId,
    clientId,
    title: String(title).trim(),
    period,
  });
  return { duplicates: matches, exists: matches.length > 0 };
}

module.exports = {
  validateDocument,
  getDocumentDetail,
  requestResend,
  deleteDocument,
  checkDuplicate,
};
