/**
 * Obrigações fiscais — operações avançadas do escritório.
 */
const { AppError } = require('../../middlewares/error.middleware');
const { getRepository } = require('../../db/supabase/repositories');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const contabilStorage = require('../../services/storage/contabil-storage.service');
const activityService = require('../../services/activity/activity.service');
const smsLogsService = require('../../services/sms/sms-logs.service');
const viewTracking = require('../../services/tracking/view-tracking.service');
const contabilNotifications = require('../../services/notifications/contabil-notifications.service');
const clientPortalNotify = require('../../services/notifications/client-portal-notify.service');

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function classifyObligationDocument(fileName = '', kind = null) {
  const normalizedKind = String(kind || '').trim().toLowerCase();
  if (normalizedKind === 'installment' || normalizedKind === 'parcelamento') {
    return {
      category: 'Parcelamento',
      notificationType: 'OBLIGATION_INSTALLMENT',
      notificationTitle: 'Proposta de parcelamento disponível',
    };
  }
  if (
    normalizedKind === 'flexibility' ||
    normalizedKind === 'flexibilization' ||
    normalizedKind === 'flexibilizacao' ||
    normalizedKind === 'flexibilização'
  ) {
    return {
      category: 'Pedido de flexibilização',
      notificationType: 'OBLIGATION_FLEXIBILITY',
      notificationTitle: 'Pedido de flexibilização disponível',
    };
  }
  if (normalizedKind === 'guide' || normalizedKind === 'guia') {
    return {
      category: 'Guia de pagamento',
      notificationType: 'OBLIGATION_GUIDE',
      notificationTitle: 'Nova guia disponível',
    };
  }

  const name = String(fileName || '').toLowerCase();
  if (/parcel/.test(name)) {
    return {
      category: 'Parcelamento',
      notificationType: 'OBLIGATION_INSTALLMENT',
      notificationTitle: 'Proposta de parcelamento disponível',
    };
  }
  if (/flexibil|prorroga|adiamento/.test(name)) {
    return {
      category: 'Pedido de flexibilização',
      notificationType: 'OBLIGATION_FLEXIBILITY',
      notificationTitle: 'Pedido de flexibilização disponível',
    };
  }
  return {
    category: 'Guia de pagamento',
    notificationType: 'OBLIGATION_GUIDE',
    notificationTitle: 'Nova guia disponível',
  };
}

async function uploadGuideToObligation({
  firmId,
  obligationId,
  file,
  actorId,
  actorName,
  notifyClient = true,
  documentKind = null,
}) {
  if (!file) throw new AppError('Ficheiro obrigatório', 400);
  const repo = getRepository();
  const ob = await repo.findObligationById(obligationId, firmId);
  if (!ob) throw new AppError('Obrigação não encontrada', 404);

  const client = await clientsRepository.findClientById(firmId, ob.clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404);

  const uploaded = await contabilStorage.uploadClientDocument({
    firmId,
    clientId: ob.clientId,
    file,
  });

  const docClass = classifyObligationDocument(file.originalname, documentKind);

  const doc = await repo.createDocument({
    firm_id: firmId,
    client_id: ob.clientId,
    obligation_id: ob.id,
    period: ob.period || currentPeriod(),
    title: file.originalname || `Guia — ${ob.title || ob.type}`,
    category: docClass.category,
    workflow_status: 'RECEIVED',
    storage_provider: uploaded.provider,
    storage_key: uploaded.path,
    mime_type: file.mimetype || 'application/pdf',
    size_bytes: file.size || null,
    uploaded_by_role: 'FIRM',
    uploaded_by_id: actorId,
    uploaded_by_name: actorName || 'Escritório',
    validation_status: 'APPROVED',
  });

  const updated = await repo.updateObligation(ob.id, firmId, {
    documentId: doc.id,
    status: 'WAITING_CLIENT',
    paymentStatus: 'PENDING',
  });

  void activityService.recordActivity({
    firmId,
    clientId: ob.clientId,
    actorRole: 'FIRM',
    actorId,
    actorName,
    eventType: 'OBLIGATION_GUIDE_UPLOADED',
    entityType: 'OBLIGATION',
    entityId: ob.id,
    title: `Guia enviada: ${ob.title || ob.type}`,
    metadata: { documentId: doc.id },
  });

  if (notifyClient && client.phone) {
    const firm = await firmsRepository.findFirmById(firmId).catch(() => null);
    void smsLogsService
      .sendTemplatedSms({
        firmId,
        clientId: client.id,
        phone: client.phone,
        templateKey: 'NEW_TAX_AVAILABLE',
        templateVars: { firmName: firm?.name, obligationTitle: ob.title || ob.type },
        entityType: 'OBLIGATION',
        entityId: ob.id,
      })
      .catch(() => { });
  }

  if (notifyClient && client.email) {
    const firm = await firmsRepository.findFirmById(firmId).catch(() => null);
    const dueLabel = ob.dueDate
      ? new Date(ob.dueDate).toLocaleDateString('pt-PT')
      : ob.due_date
        ? new Date(ob.due_date).toLocaleDateString('pt-PT')
        : undefined;
    void contabilNotifications
      .notifyClientObligationAssigned({
        clientEmail: client.email,
        clientName: client.displayName || client.name,
        obligationTitle: ob.title || ob.type,
        firmName: firm?.name,
        dueDate: dueLabel,
        hasGuide: true,
      })
      .catch(() => {});
  }

  if (notifyClient) {
    await clientPortalNotify.notifyClientPortal({
      firmId,
      clientId: client.id,
      category: 'OBLIGATION',
      type: docClass.notificationType,
      title: docClass.notificationTitle,
      body: `${ob.title || ob.type} — consulte e efetue o pagamento no portal.`,
      entityType: 'OBLIGATION',
      entityId: ob.id,
      actionUrl: '/app/client/agenda',
    });
  }

  return { obligation: updated, document: { _id: doc.id, title: doc.title, mimeType: doc.mime_type } };
}

async function getObligationTimeline({ firmId, obligationId }) {
  const repo = getRepository();
  const ob = await repo.findObligationById(obligationId, firmId);
  if (!ob) throw new AppError('Obrigação não encontrada', 404);

  const [activities, viewStats] = await Promise.all([
    activityService.listActivityForEntity({
      firmId,
      entityType: 'OBLIGATION',
      entityId: obligationId,
      limit: 40,
    }),
    viewTracking.getViewStats({ firmId, entityType: 'OBLIGATION', entityId: obligationId }),
  ]);

  let document = null;
  if (ob.documentId) {
    document = await repo.findDocumentById(ob.documentId, firmId);
  }

  const client = await clientsRepository.findClientById(firmId, ob.clientId);

  const sb = require('../../db/supabase/client').getSupabaseAdmin();
  let obligationDocuments = [];
  if (sb) {
    const { data: docs } = await sb
      .from('documents')
      .select('id, title, mime_type, category, validation_status, workflow_status, created_at, uploaded_by_role, size_bytes')
      .eq('firm_id', firmId)
      .eq('obligation_id', obligationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    obligationDocuments = (docs || []).map((d) => ({
      id: d.id,
      _id: d.id,
      title: d.title,
      mimeType: d.mime_type,
      category: d.category,
      validationStatus: d.validation_status,
      workflowStatus: d.workflow_status,
      createdAt: d.created_at,
      uploadedByRole: d.uploaded_by_role,
    }));
  }

  return {
    obligation: ob,
    clientName: client?.displayName || client?.name,
    document,
    documents: obligationDocuments,
    viewStats,
    timeline: activities,
  };
}

async function listObligationsWithEngagement({ firmId, clientId, period }) {
  const repo = getRepository();
  const items = await repo.listObligations({
    firmId,
    clientId,
    period,
  });

  const enriched = await Promise.all(
    items.map(async (ob) => {
      const stats = await viewTracking.getViewStats({
        firmId,
        entityType: 'OBLIGATION',
        entityId: ob._id || ob.id,
      });
      return { ...ob, viewStats: stats };
    })
  );

  return enriched;
}

module.exports = {
  uploadGuideToObligation,
  getObligationTimeline,
  listObligationsWithEngagement,
};
