const crypto = require('crypto');
const { AppError } = require('../../middlewares/error.middleware');
const serviceInquiriesRepository = require('../../db/supabase/repositories/service-inquiries.repository');
const serviceInquiryDocumentsRepository = require('../../db/supabase/repositories/service-inquiry-documents.repository');
const leadsRepository = require('../../db/supabase/repositories/leads.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const accountingServicesService = require('./accounting-services.service');
const leadsService = require('./leads.service');
const contabilStorage = require('../../services/storage/contabil-storage.service');
const contabilNotifications = require('../../services/notifications/contabil-notifications.service');
const auditRepository = require('../../db/supabase/repositories/contabil/audit.repository');

const VALID_STATUSES = ['NEW', 'CONTACTED', 'DOCS_REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

async function enrichForList(firmId, inquiries) {
  const serviceIds = [...new Set(inquiries.map((i) => i.serviceId).filter(Boolean))];
  const services = await accountingServicesRepository.findByIdsForFirm(serviceIds, firmId);
  const serviceById = new Map(services.map((s) => [s.id, s]));

  const enriched = [];
  for (const inquiry of inquiries) {
    enriched.push({
      ...inquiry,
      serviceName: serviceById.get(inquiry.serviceId)?.name || null,
      requesterName: await requesterNameForInquiry(inquiry),
    });
  }
  return enriched;
}

async function list({ firmId, status, serviceId }) {
  if (status && !VALID_STATUSES.includes(status)) throw new AppError('Estado inválido', 400);
  const items = await serviceInquiriesRepository.listByFirm(firmId, { status, serviceId });
  return { items: await enrichForList(firmId, items) };
}

async function getById({ firmId, id }) {
  const inquiry = await serviceInquiriesRepository.findByIdForFirm(id, firmId);
  if (!inquiry) throw new AppError('Solicitação não encontrada', 404);

  const service = await accountingServicesRepository.findByIdForFirm(inquiry.serviceId, firmId);
  const requesterName = await requesterNameForInquiry(inquiry);
  const requiredDocuments = accountingServicesService.resolveRequiredDocuments(service, inquiry.answers);
  const receivedDocs = await serviceInquiryDocumentsRepository.listByInquiry(inquiry.id, firmId);
  const receivedByTag = new Map(receivedDocs.map((d) => [d.tag, d]));
  const checklist = requiredDocuments.map((d) => {
    const doc = receivedByTag.get(d.tag);
    return {
      ...d,
      received: Boolean(doc),
      documentId: doc?.id || null,
      mimeType: doc?.mimeType || null,
      createdAt: doc?.createdAt || null,
    };
  });

  return {
    inquiry: { ...inquiry, serviceName: service?.name || null, requesterName },
    checklist,
  };
}

/** Download (staff, autenticado) de um documento entregue via o mini-portal por token. */
async function getDocumentDownloadUrl({ firmId, inquiryId, documentId }) {
  const inquiry = await serviceInquiriesRepository.findByIdForFirm(inquiryId, firmId);
  if (!inquiry) throw new AppError('Solicitação não encontrada', 404);
  const doc = await serviceInquiryDocumentsRepository.findByIdForInquiry(documentId, inquiryId, firmId);
  if (!doc) throw new AppError('Documento não encontrado', 404);
  const url = await contabilStorage.createSignedDownloadUrl(doc.storageKey);
  return { url, title: doc.title, mimeType: doc.mimeType };
}

async function create({ firmId, actor, payload }) {
  const serviceId = payload?.serviceId;
  if (!serviceId) throw new AppError('service_id é obrigatório', 400);
  const service = await accountingServicesRepository.findByIdForFirm(serviceId, firmId);
  if (!service) throw new AppError('Serviço não encontrado', 404);

  const leadId = payload?.leadId || null;
  const clientId = payload?.clientId || null;
  if ((leadId && clientId) || (!leadId && !clientId)) {
    throw new AppError('Indique exactamente um: leadId OU clientId', 400);
  }
  if (leadId) {
    const lead = await leadsRepository.findByIdForFirm(leadId, firmId);
    if (!lead) throw new AppError('Lead não encontrado', 404);
  }
  if (clientId) {
    const client = await clientsRepository.findClientById(firmId, clientId);
    if (!client) throw new AppError('Cliente não encontrado', 404);
  }

  const inquiry = await serviceInquiriesRepository.createRow({
    firmId,
    serviceId,
    leadId,
    clientId,
    notes: payload?.notes,
    assignedStaffId: payload?.assignedStaffId,
    createdBy: actor?.id || null,
  });

  await auditRepository.writeAuditLog({
    firmId,
    actorRole: 'FIRM',
    actorId: actor?.id,
    action: 'service_inquiry.created',
    entityType: 'service_inquiry',
    entityId: inquiry.id,
    metadata: { serviceId, leadId, clientId },
  });

  return { inquiry };
}

function assertValidTransition(fromStatus, toStatus) {
  if (!VALID_STATUSES.includes(toStatus)) throw new AppError('Estado inválido', 400);
  if (TERMINAL_STATUSES.has(fromStatus)) {
    throw new AppError(`Solicitação em estado terminal (${fromStatus}) não pode mudar de estado`, 409);
  }
}

async function update({ firmId, id, actor, payload }) {
  const existing = await serviceInquiriesRepository.findByIdForFirm(id, firmId);
  if (!existing) throw new AppError('Solicitação não encontrada', 404);

  const patch = {};
  if (payload?.notes !== undefined) patch.notes = payload.notes;
  if (payload?.assignedStaffId !== undefined) patch.assignedStaffId = payload.assignedStaffId;
  if (payload?.status !== undefined) {
    assertValidTransition(existing.status, payload.status);
    patch.status = payload.status;
  }

  const inquiry = await serviceInquiriesRepository.updateRow(id, firmId, patch);

  if (patch.status && patch.status !== existing.status) {
    await auditRepository.writeAuditLog({
      firmId,
      actorRole: 'FIRM',
      actorId: actor?.id,
      action: 'service_inquiry.status_changed',
      entityType: 'service_inquiry',
      entityId: id,
      metadata: { from: existing.status, to: patch.status },
    });
  }

  return { inquiry };
}

async function resolveStaffNotifyEmail(firmId, firm) {
  const ownerEmail = await firmUsersRepository.findFirmOwnerEmail(firmId).catch(() => null);
  return ownerEmail || firm?.settings?.contactEmail || firm?.settings?.notificationEmail || null;
}

async function requesterNameForInquiry(inquiry) {
  if (inquiry.leadId) {
    const lead = await leadsRepository.findByIdForFirm(inquiry.leadId, inquiry.firmId);
    return lead?.name || null;
  }
  if (inquiry.clientId) {
    const client = await clientsRepository.findClientById(inquiry.firmId, inquiry.clientId);
    return client?.displayName || client?.name || null;
  }
  return null;
}

/**
 * Submissão pública do formulário de um Service (vertical slice IRS — ver
 * especificação da sessão, secção 5). Resolve o Firm pelo slug, resolve
 * identidade (Lead ou Client existente), cria a ServiceInquiry com as
 * respostas e um access_token para o mini-portal, e notifica submissor+equipa.
 * Nunca revela ao chamador se bateu em Lead novo/existente ou Client.
 */
async function submitPublicIntake({ firmSlug, serviceSlug, payload }) {
  const firm = await firmsRepository.findFirmBySlugOrLabel(firmSlug);
  if (!firm) throw new AppError('Pedido não encontrado', 404, { code: 'NOT_FOUND' });

  const services = await accountingServicesRepository.listByFirm(firm.id, { activeOnly: true });
  const service = services.find((s) => s.slug === serviceSlug && s.isPubliclyListed);
  if (!service) throw new AppError('Pedido não encontrado', 404, { code: 'NOT_FOUND' });

  const name = String(payload?.name || '').trim();
  if (!name) throw new AppError('Nome é obrigatório', 400);
  const email = payload?.email ? String(payload.email).trim() : null;
  const phone = payload?.phone ? String(payload.phone).trim() : null;
  const taxId = payload?.taxId ? String(payload.taxId).trim() : null;
  if (!email && !phone) throw new AppError('Indique pelo menos email ou telefone', 400);

  const answers = payload?.answers && typeof payload.answers === 'object' && !Array.isArray(payload.answers)
    ? payload.answers
    : {};

  const identity = await leadsService.resolveIdentity(firm.id, {
    name,
    email,
    phone,
    taxId,
    source: 'PUBLIC_FORM',
    createdBy: null,
  });

  const requiredDocuments = accountingServicesService.resolveRequiredDocuments(service, answers);
  const accessToken = crypto.randomBytes(32).toString('hex');
  const submittedAt = new Date().toISOString();
  // Nada a aguardar -> pronta para a equipa trabalhar já; documentos pendentes -> aguarda entrega.
  const initialStatus = requiredDocuments.length > 0 ? 'DOCS_REQUESTED' : 'IN_PROGRESS';

  const inquiry = await serviceInquiriesRepository.createRow({
    firmId: firm.id,
    serviceId: service.id,
    leadId: identity.type === 'LEAD' ? identity.id : null,
    clientId: identity.type === 'CLIENT' ? identity.id : null,
    answers,
    submittedAt,
    accessToken,
    status: initialStatus,
  });

  await auditRepository.writeAuditLog({
    firmId: firm.id,
    actorRole: 'PUBLIC',
    actorId: null,
    action: 'service_inquiry.submitted',
    entityType: 'service_inquiry',
    entityId: inquiry.id,
    metadata: { serviceId: service.id, identityType: identity.type, documentsRequired: requiredDocuments.length },
  });

  if (email) {
    void contabilNotifications
      .notifyLeadIntakeChecklist({
        toEmail: email,
        toName: name,
        firmName: firm.name,
        serviceName: service.name,
        accessToken,
        documents: requiredDocuments,
      })
      .catch(() => {});
  }
  const staffEmail = await resolveStaffNotifyEmail(firm.id, firm);
  if (staffEmail) {
    void contabilNotifications
      .notifyFirmIntakeSubmitted({
        staffEmail,
        firmName: firm.name,
        requesterName: name,
        serviceName: service.name,
        documentsCount: requiredDocuments.length,
      })
      .catch(() => {});
  }

  return { inquiry, requiredDocuments };
}

/** Checklist pública pelo token do mini-portal — nunca devolve firm_id/lead_id/client_id. */
async function getByAccessToken(token) {
  const inquiry = await serviceInquiriesRepository.findByAccessToken(token);
  if (!inquiry) throw new AppError('Pedido não encontrado', 404, { code: 'NOT_FOUND' });

  const service = await accountingServicesRepository.findByIdForFirm(inquiry.serviceId, inquiry.firmId);
  const requiredDocuments = accountingServicesService.resolveRequiredDocuments(service, inquiry.answers);
  const received = await serviceInquiryDocumentsRepository.listByInquiry(inquiry.id, inquiry.firmId);
  const receivedTags = new Set(received.map((d) => d.tag));

  return {
    serviceName: service?.name || null,
    status: inquiry.status,
    checklist: requiredDocuments.map((d) => ({ ...d, received: receivedTags.has(d.tag) })),
  };
}

/** Upload de um documento pedido, via o mini-portal por token (sem login). */
async function recordDocumentDelivery({ token, tag, file }) {
  const inquiry = await serviceInquiriesRepository.findByAccessToken(token);
  if (!inquiry) throw new AppError('Pedido não encontrado', 404, { code: 'NOT_FOUND' });
  if (TERMINAL_STATUSES.has(inquiry.status)) {
    throw new AppError('Este pedido já foi encerrado', 409);
  }

  const service = await accountingServicesRepository.findByIdForFirm(inquiry.serviceId, inquiry.firmId);
  const requiredDocuments = accountingServicesService.resolveRequiredDocuments(service, inquiry.answers);
  const requirement = requiredDocuments.find((d) => d.tag === tag);
  if (!requirement) throw new AppError('Documento não reconhecido para este pedido', 400);

  const uploaded = await contabilStorage.uploadServiceInquiryDocument({
    firmId: inquiry.firmId,
    serviceInquiryId: inquiry.id,
    file,
  });

  await serviceInquiryDocumentsRepository.createRow({
    firmId: inquiry.firmId,
    serviceInquiryId: inquiry.id,
    tag: requirement.tag,
    title: requirement.title,
    storageProvider: uploaded.provider,
    storageKey: uploaded.path,
    mimeType: file.mimetype || null,
    sizeBytes: file.size || null,
  });

  const received = await serviceInquiryDocumentsRepository.listByInquiry(inquiry.id, inquiry.firmId);
  const receivedTags = new Set(received.map((d) => d.tag));
  const allComplete = requiredDocuments.every((d) => receivedTags.has(d.tag));

  if (allComplete && inquiry.status === 'DOCS_REQUESTED') {
    await serviceInquiriesRepository.updateRow(inquiry.id, inquiry.firmId, { status: 'IN_PROGRESS' });
  }

  const firm = await firmsRepository.findFirmById(inquiry.firmId).catch(() => null);
  const staffEmail = firm ? await resolveStaffNotifyEmail(inquiry.firmId, firm) : null;
  if (staffEmail) {
    const requesterName = await requesterNameForInquiry(inquiry);
    void contabilNotifications
      .notifyFirmIntakeDocumentReceived({
        staffEmail,
        firmName: firm?.name,
        requesterName,
        serviceName: service?.name,
        documentTitle: requirement.title,
        allComplete,
      })
      .catch(() => {});
  }

  return { allComplete, checklist: requiredDocuments.map((d) => ({ ...d, received: receivedTags.has(d.tag) })) };
}

module.exports = {
  list,
  getById,
  create,
  update,
  submitPublicIntake,
  getByAccessToken,
  recordDocumentDelivery,
  getDocumentDownloadUrl,
  VALID_STATUSES,
};
