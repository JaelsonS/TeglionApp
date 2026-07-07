/**
 * Documentos do portal cliente — extraído de portal.service.js.
 */
const { AppError } = require('../../../middlewares/error.middleware');
const { getRepository } = require('../../../db/supabase/repositories');
const firmsRepository = require('../../../db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../../../db/supabase/repositories/firm-users.repository');
const messagesRepository = require('../../../db/supabase/repositories/messages.repository');
const contabilStorage = require('../../../services/storage/contabil-storage.service');
const contabilNotifications = require('../../../services/notifications/contabil-notifications.service');
const { requireLinkedClient } = require('./client.guard');
const { currentPeriod, normalizeDocumentList } = require('./hub.helpers');
const { submitTask } = require('./tasks.service');
const { createInAppNotification } = require('./notifications.helper');

async function uploadClientDocument({
  actor,
  file,
  obligationId = null,
  clientTaskId = null,
  documentRequestId = null,
  period = null,
  title = null,
  description = null,
  observations = null,
  category = null,
  tags = null,
  skipNotifications = false,
}) {
  const client = await requireLinkedClient(actor);
  if (!file) throw new AppError('Ficheiro obrigatório', 400);
  const repo = getRepository();

  if (obligationId) {
    const ob = await repo.findObligationById(obligationId, client.firmId);
    if (!ob || ob.clientId !== client.id) throw new AppError('Obrigação não encontrada', 404);
  }

  if (clientTaskId) {
    const task = await repo.findClientTaskById(clientTaskId, client.firmId, client.id);
    if (!task) throw new AppError('Tarefa não encontrada', 404);
  }

  const documentRequestsService = require('../../document-requests/document-requests.service');
  const documentRequestsRepo = require('../../../db/supabase/repositories/document-requests.repository');
  let linkedRequest = null;
  if (documentRequestId) {
    const found = await documentRequestsRepo.findById(documentRequestId, client.firmId);
    if (!found || found.clientId !== client.id) {
      throw new AppError('Pedido de documento não encontrado', 404);
    }
    linkedRequest = found;
    if (['completed', 'answered'].includes(String(linkedRequest.status))) {
      throw new AppError('Este pedido já foi respondido', 409);
    }
  }

  const uploaded = await contabilStorage.uploadClientDocument({
    firmId: client.firmId,
    clientId: client.id,
    file,
  });
  const docTitle = title ? String(title).trim() : file.originalname || 'Documento';
  const docPeriod = period || currentPeriod();
  const dupes = await repo.findDuplicateDocument({
    firmId: client.firmId,
    clientId: client.id,
    title: docTitle,
    period: docPeriod,
  });

  const tagList = tags
    ? String(tags)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const doc = await repo.createDocument({
    firm_id: client.firmId,
    client_id: client.id,
    obligation_id: obligationId || null,
    client_task_id: clientTaskId || null,
    period: docPeriod,
    title: docTitle,
    description: description ? String(description).trim() : null,
    observations: observations ? String(observations).trim() : null,
    category: category ? String(category).trim() : null,
    tags: tagList.length ? tagList : [],
    workflow_status: 'SENT',
    storage_provider: uploaded.provider,
    storage_key: uploaded.path,
    storage_url: null,
    mime_type: file.mimetype || null,
    size_bytes: file.size || null,
    uploaded_by_role: 'CLIENT',
    uploaded_by_id: client.id,
    uploaded_by_name: client.displayName || client.name || 'Cliente',
    validation_status: 'PENDING',
  });

  const activityService = require('../../../services/activity/activity.service');
  void activityService.recordActivity({
    firmId: client.firmId,
    clientId: client.id,
    actorRole: 'CLIENT',
    actorId: client.id,
    actorName: client.displayName || client.name,
    eventType: 'DOCUMENT_UPLOADED',
    entityType: 'DOCUMENT',
    entityId: doc.id,
    title: `Documento enviado: ${docTitle}`,
    description: category ? `Categoria: ${category}` : null,
    metadata: { tags: tagList, mimeType: file.mimetype },
  });

  if (linkedRequest) {
    await documentRequestsService.answerWithDocument({
      firmId: client.firmId,
      clientId: client.id,
      requestId: linkedRequest.id,
      documentId: doc.id,
    });
  }

  if (clientTaskId) {
    await submitTask({ actor, taskId: clientTaskId });
  } else if (obligationId) {
    const ob = await repo.findObligationById(obligationId, client.firmId);
    if (ob && ['PENDING', 'WAITING_CLIENT'].includes(ob.status)) {
      await repo.updateObligation(obligationId, client.firmId, { status: 'IN_PROGRESS' });
    }
  }

  if (!skipNotifications) {
    const firm = await firmsRepository.findFirmById(client.firmId).catch(() => null);
    const ownerEmail = await firmUsersRepository.findFirmOwnerEmail(client.firmId).catch(() => null);
    const notifyEmail = ownerEmail || firm?.settings?.contactEmail || firm?.settings?.notificationEmail;
    if (notifyEmail) {
      void contabilNotifications
        .notifyFirmDocumentReceived({
          staffEmail: notifyEmail,
          clientName: client.displayName || client.name,
          documentTitle: docTitle,
          firmName: firm?.name,
        })
        .catch(() => {});
    }

    if (client.phone) {
      const smsLogs = require('../../../services/sms/sms-logs.service');
      void smsLogs
        .sendTemplatedSms({
          firmId: client.firmId,
          clientId: client.id,
          phone: client.phone,
          templateKey: 'DOCUMENT_SENT',
          templateVars: { firmName: firm?.name },
          entityType: 'DOCUMENT',
          entityId: doc.id,
        })
        .catch(() => {});
    }
  }

  return {
    document: {
      _id: doc.id,
      title: doc.title,
      period: doc.period,
      createdAt: doc.created_at,
      workflowStatus: doc.workflow_status || 'SENT',
      category: doc.category,
      tags: doc.tags,
    },
    possibleDuplicate: dupes.length > 0,
    duplicates: dupes,
  };
}

async function uploadClientDocumentsBatch({
  actor,
  files,
  obligationId,
  clientTaskId,
  period,
  title,
  description,
  observations,
  category,
  tags,
}) {
  const results = [];
  for (const file of files || []) {
    const r = await uploadClientDocument({
      actor,
      file,
      obligationId,
      clientTaskId,
      period,
      title: title || file.originalname,
      description,
      observations,
      category,
      tags,
      skipNotifications: true,
    });
    results.push(r);
  }

  if (results.length > 0) {
    const client = await requireLinkedClient(actor);
    const firm = await firmsRepository.findFirmById(client.firmId).catch(() => null);
    const firstDoc = results[0]?.document;
    const ownerEmail = await firmUsersRepository.findFirmOwnerEmail(client.firmId).catch(() => null);
    const notifyEmail = ownerEmail || firm?.settings?.contactEmail || firm?.settings?.notificationEmail;
    if (notifyEmail && firstDoc) {
      void contabilNotifications
        .notifyFirmDocumentReceived({
          staffEmail: notifyEmail,
          clientName: client.displayName || client.name,
          documentTitle:
            results.length > 1
              ? `${results.length} documentos enviados`
              : firstDoc.title || 'Documento',
          firmName: firm?.name,
        })
        .catch(() => {});
    }
    if (client.phone && firstDoc?._id) {
      const smsLogs = require('../../../services/sms/sms-logs.service');
      void smsLogs
        .sendTemplatedSms({
          firmId: client.firmId,
          clientId: client.id,
          phone: client.phone,
          templateKey: 'DOCUMENT_SENT',
          templateVars: { firmName: firm?.name },
          entityType: 'DOCUMENT',
          entityId: firstDoc._id,
        })
        .catch(() => {});
    }
  }

  return { documents: results, count: results.length };
}

async function markObligationPaid({ actor, obligationId, paymentProofFile }) {
  const client = await requireLinkedClient(actor);
  const repo = getRepository();
  const ob = await repo.findObligationById(obligationId, client.firmId);
  if (!ob || ob.clientId !== client.id) throw new AppError('Obrigação não encontrada', 404);

  let proofDocId = null;
  if (paymentProofFile) {
    const proof = await uploadClientDocument({
      actor,
      file: paymentProofFile,
      obligationId,
      title: `Comprovativo — ${ob.title || ob.type}`,
      category: 'Comprovativo de pagamento',
    });
    proofDocId = proof.document._id;
  }

  const updated = await repo.updateObligation(ob.id, client.firmId, {
    paymentStatus: 'PAID',
    status: 'DELIVERED',
    paymentProofDocumentId: proofDocId,
  });

  void createInAppNotification({
    firmId: client.firmId,
    clientId: client.id,
    type: 'OBLIGATION_PAID',
    title: 'Pagamento confirmado',
    body: `Confirmou o pagamento de «${ob.title || ob.type}».`,
    entityType: 'OBLIGATION',
    entityId: ob.id,
  });

  const activityService = require('../../../services/activity/activity.service');
  void activityService.recordActivity({
    firmId: client.firmId,
    clientId: client.id,
    actorRole: 'CLIENT',
    actorId: client.id,
    actorName: client.displayName || client.name,
    eventType: 'OBLIGATION_PAID',
    entityType: 'OBLIGATION',
    entityId: ob.id,
    title: `Pagamento confirmado: ${ob.title || ob.type}`,
  });

  return { obligation: updated };
}

async function listMyDocumentRequests({ actor }) {
  const client = await requireLinkedClient(actor);
  const documentRequestsService = require('../../document-requests/document-requests.service');
  const { items } = await documentRequestsService.listByClient({
    firmId: client.firmId,
    clientId: client.id,
  });
  return { items };
}

async function markMyDocumentRequestSeen({ actor, requestId }) {
  const client = await requireLinkedClient(actor);
  const documentRequestsService = require('../../document-requests/document-requests.service');
  return documentRequestsService.markSeenById({
    firmId: client.firmId,
    clientId: client.id,
    requestId,
  });
}

async function listMyDocuments({ actor, validationStatus, period, limit = 100 }) {
  const client = await requireLinkedClient(actor);
  const repo = getRepository();
  const raw = await repo.listDocuments({
    firmId: client.firmId,
    clientId: client.id,
    limit: Math.min(Number(limit) || 100, 200),
  });
  let items = normalizeDocumentList(raw);
  if (validationStatus) {
    items = items.filter(
      (d) => String(d.validationStatus || '').toUpperCase() === String(validationStatus).toUpperCase(),
    );
  }
  if (period) {
    items = items.filter((d) => (d.period || '').startsWith(String(period)));
  }
  return { items, total: items.length };
}

async function deliverObligation({ actor, obligationId }) {
  const client = await requireLinkedClient(actor);
  const repo = getRepository();
  const ob = await repo.findObligationById(obligationId, client.firmId);
  if (!ob || ob.clientId !== client.id) throw new AppError('Obrigação não encontrada', 404);
  const updated = await repo.updateObligation(ob.id, client.firmId, { status: 'IN_PROGRESS' });
  await messagesRepository.createMessage({
    firmId: client.firmId,
    clientId: client.id,
    senderRole: 'CLIENT',
    senderId: client.id,
    body: `Cliente marcou entrega da obrigação «${ob.title || ob.type}».`,
    obligationId: ob.id,
  });
  return { obligation: updated };
}

module.exports = {
  uploadClientDocument,
  uploadClientDocumentsBatch,
  markObligationPaid,
  listMyDocumentRequests,
  markMyDocumentRequestSeen,
  listMyDocuments,
  deliverObligation,
};
