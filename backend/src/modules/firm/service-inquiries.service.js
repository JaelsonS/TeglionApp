const crypto = require('crypto');
const { AppError } = require('../../middlewares/error.middleware');
const serviceInquiriesRepository = require('../../db/supabase/repositories/service-inquiries.repository');
const serviceInquiryDocumentsRepository = require('../../db/supabase/repositories/service-inquiry-documents.repository');
const serviceInquiryRequestsRepository = require('../../db/supabase/repositories/service-inquiry-requests.repository');
const leadsRepository = require('../../db/supabase/repositories/leads.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const accountingServicesService = require('./accounting-services.service');
const leadsService = require('./leads.service');
const bookingService = require('../booking/booking.service');
const contabilStorage = require('../../services/storage/contabil-storage.service');
const contabilNotifications = require('../../services/notifications/contabil-notifications.service');
const auditRepository = require('../../db/supabase/repositories/contabil/audit.repository');

const VALID_STATUSES = ['NEW', 'CONTACTED', 'DOCS_REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

// Ciclo de vida do access_token do mini-portal (ver especificação da sessão, v8):
// tecto generoso desde a submissão (cobre um processo lento sem expirar por engano),
// apertado para uma janela curta assim que a ServiceInquiry fica concluída/cancelada.
const ACCESS_TOKEN_TTL_MS = 180 * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_GRACE_MS = 30 * 24 * 60 * 60 * 1000;

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

/** Forma comum do item de checklist devolvida ao staff e ao mini-portal — um
 * pedido (documento ou pergunta em texto), da tabela service_inquiry_requests. */
function toChecklistItem(request) {
  return {
    id: request.id,
    kind: request.kind,
    tag: request.tag,
    title: request.title,
    instructions: request.instructions,
    received: request.status === 'ANSWERED',
    documentId: request.documentId,
    textReply: request.textReply,
    createdAt: request.createdAt,
    answeredAt: request.answeredAt,
  };
}

async function getById({ firmId, id }) {
  const inquiry = await serviceInquiriesRepository.findByIdForFirm(id, firmId);
  if (!inquiry) throw new AppError('Solicitação não encontrada', 404);

  const service = await accountingServicesRepository.findByIdForFirm(inquiry.serviceId, firmId);
  const requesterName = await requesterNameForInquiry(inquiry);
  const requests = await serviceInquiryRequestsRepository.listByInquiry(inquiry.id, firmId);

  return {
    inquiry: { ...inquiry, serviceName: service?.name || null, requesterName },
    checklist: requests.map(toChecklistItem),
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
    if (TERMINAL_STATUSES.has(payload.status)) {
      // Aperta a janela do access_token assim que o pedido fecha — deixa de valer
      // indefinidamente, mas dá tempo ao cliente de rever a confirmação.
      patch.accessTokenExpiresAt = new Date(Date.now() + ACCESS_TOKEN_GRACE_MS).toISOString();
    }
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

/** Revogação manual do access_token pela equipa (ex.: suspeita de link vazado). */
async function revokeAccessToken({ firmId, id, actor }) {
  const existing = await serviceInquiriesRepository.findByIdForFirm(id, firmId);
  if (!existing) throw new AppError('Solicitação não encontrada', 404);
  if (existing.accessTokenRevokedAt) return { inquiry: existing };

  const inquiry = await serviceInquiriesRepository.updateRow(id, firmId, {
    accessTokenRevokedAt: new Date().toISOString(),
  });

  await auditRepository.writeAuditLog({
    firmId,
    actorRole: 'FIRM',
    actorId: actor?.id,
    action: 'service_inquiry.token_revoked',
    entityType: 'service_inquiry',
    entityId: id,
    metadata: {},
  });

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

  // Agendamento — reaproveita bookingService.bookAsClient() tal e qual (o mesmo usado
  // pelo portal do cliente autenticado). Só é possível reservar de imediato quando a
  // identidade já é um Client: consultations.client_id não é opcional, não há como criar
  // uma consulta real para um Lead novo sem alterar esse schema (fora do escopo desta fase).
  // Para um Lead, o horário pretendido fica registado como nota — a equipa agenda pela
  // agenda normal depois de converter o Lead (ver especificação da sessão, Fase D).
  let bookedConsultation = null;
  let bookingNote = null;
  if (service.requiresBooking && payload?.scheduledAt) {
    if (identity.type === 'CLIENT') {
      const booked = await bookingService.bookAsClient({
        firmId: firm.id,
        clientId: identity.id,
        serviceId: service.id,
        scheduledAt: payload.scheduledAt,
      });
      bookedConsultation = booked.consultation;
    } else {
      const when = new Date(payload.scheduledAt);
      if (Number.isFinite(when.getTime())) {
        bookingNote = `Horário pretendido: ${when.toLocaleString('pt-PT', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'Europe/Lisbon',
        })}`;
      }
    }
  }

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
    notes: bookingNote,
    answers,
    submittedAt,
    accessToken,
    accessTokenExpiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString(),
    status: initialStatus,
  });

  if (bookedConsultation) {
    await serviceInquiriesRepository.updateRow(inquiry.id, firm.id, { consultationId: bookedConsultation.id });
    inquiry.consultationId = bookedConsultation.id;
  }

  // Materializa o checklist inicial (ver especificação da sessão, v8, secção 2) — deixa
  // de ser recalculado a cada leitura, fica numa tabela real que a equipa pode estender
  // depois com pedidos adicionais (Fase 2b), sem misturar as duas fontes.
  if (requiredDocuments.length > 0) {
    await serviceInquiryRequestsRepository.createMany(
      requiredDocuments.map((d) => ({
        firmId: firm.id,
        serviceInquiryId: inquiry.id,
        kind: 'document',
        tag: d.tag,
        title: d.title,
        instructions: d.instructions,
      })),
    );
  }

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

  return { inquiry, requiredDocuments, consultation: bookedConsultation };
}

/** Checklist pública pelo token do mini-portal — nunca devolve firm_id/lead_id/client_id. */
async function getByAccessToken(token) {
  const inquiry = await serviceInquiriesRepository.findByAccessToken(token);
  if (!inquiry) throw new AppError('Pedido não encontrado', 404, { code: 'NOT_FOUND' });

  const service = await accountingServicesRepository.findByIdForFirm(inquiry.serviceId, inquiry.firmId);
  const requests = await serviceInquiryRequestsRepository.listByInquiry(inquiry.id, inquiry.firmId);

  return {
    serviceName: service?.name || null,
    status: inquiry.status,
    checklist: requests.map(toChecklistItem),
  };
}

/** Upload de um documento pedido, via o mini-portal por token (sem login). */
async function recordDocumentDelivery({ token, tag, file }) {
  const inquiry = await serviceInquiriesRepository.findByAccessToken(token);
  if (!inquiry) throw new AppError('Pedido não encontrado', 404, { code: 'NOT_FOUND' });
  if (TERMINAL_STATUSES.has(inquiry.status)) {
    throw new AppError('Este pedido já foi encerrado', 409);
  }

  const request = await serviceInquiryRequestsRepository.findPendingDocumentByTag(inquiry.id, inquiry.firmId, tag);
  if (!request) throw new AppError('Documento não reconhecido para este pedido', 400);

  const uploaded = await contabilStorage.uploadServiceInquiryDocument({
    firmId: inquiry.firmId,
    serviceInquiryId: inquiry.id,
    file,
  });

  const deliveredDoc = await serviceInquiryDocumentsRepository.createRow({
    firmId: inquiry.firmId,
    serviceInquiryId: inquiry.id,
    tag: request.tag,
    title: request.title,
    storageProvider: uploaded.provider,
    storageKey: uploaded.path,
    mimeType: file.mimetype || null,
    sizeBytes: file.size || null,
  });

  await serviceInquiryRequestsRepository.markAnswered(request.id, inquiry.firmId, { documentId: deliveredDoc.id });

  await auditRepository.writeAuditLog({
    firmId: inquiry.firmId,
    actorRole: 'PUBLIC',
    actorId: null,
    action: 'service_inquiry.document_delivered',
    entityType: 'service_inquiry',
    entityId: inquiry.id,
    metadata: { tag: request.tag, documentId: deliveredDoc.id },
  });

  const allRequests = await serviceInquiryRequestsRepository.listByInquiry(inquiry.id, inquiry.firmId);
  // A transição automática só olha para o checklist original (materializado na
  // submissão, createdBy nulo) — pedidos adicionados depois pela equipa (Fase 2b)
  // não fazem o estado avançar sozinho, isso fica sempre a critério da equipa.
  const originalDocuments = allRequests.filter((r) => r.kind === 'document' && !r.createdBy);
  const allComplete = originalDocuments.length > 0 && originalDocuments.every((r) => r.status === 'ANSWERED');

  if (allComplete && inquiry.status === 'DOCS_REQUESTED') {
    await serviceInquiriesRepository.updateRow(inquiry.id, inquiry.firmId, { status: 'IN_PROGRESS' });
    await auditRepository.writeAuditLog({
      firmId: inquiry.firmId,
      actorRole: 'PUBLIC',
      actorId: null,
      action: 'service_inquiry.status_changed',
      entityType: 'service_inquiry',
      entityId: inquiry.id,
      metadata: { from: 'DOCS_REQUESTED', to: 'IN_PROGRESS', reason: 'all_documents_received' },
    });
  }

  const service = await accountingServicesRepository.findByIdForFirm(inquiry.serviceId, inquiry.firmId);
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
        documentTitle: request.title,
        allComplete,
      })
      .catch(() => {});
  }

  return { allComplete, checklist: allRequests.map(toChecklistItem) };
}

module.exports = {
  list,
  getById,
  create,
  update,
  revokeAccessToken,
  submitPublicIntake,
  getByAccessToken,
  recordDocumentDelivery,
  getDocumentDownloadUrl,
  VALID_STATUSES,
};
