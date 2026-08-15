const crypto = require('crypto');
const { AppError } = require('../../middlewares/error.middleware');
const serviceInquiriesRepository = require('../../db/supabase/repositories/service-inquiries.repository');
const serviceInquiryDocumentsRepository = require('../../db/supabase/repositories/service-inquiry-documents.repository');
const serviceInquiryRequestsRepository = require('../../db/supabase/repositories/service-inquiry-requests.repository');
const leadsRepository = require('../../db/supabase/repositories/leads.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const consultationsRepository = require('../../db/supabase/repositories/consultations.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const firmInquiryTagsRepository = require('../../db/supabase/repositories/firm-inquiry-tags.repository');
const accountingServicesService = require('./accounting-services.service');
const leadsService = require('./leads.service');
const bookingService = require('../booking/booking.service');
const contabilStorage = require('../../services/storage/contabil-storage.service');
const contabilNotifications = require('../../services/notifications/contabil-notifications.service');
const auditRepository = require('../../db/supabase/repositories/contabil/audit.repository');
const { interpolateServiceTemplate } = require('../../utils/service-text-template');

/** Regras do serviço: [{ questionId, equals, tagId }] → tagIds a aplicar. */
function resolveTagIdsFromRules(rules, answers) {
  if (!Array.isArray(rules) || !rules.length || !answers || typeof answers !== 'object') return [];
  const ids = new Set();
  for (const rule of rules) {
    const questionId = rule?.questionId != null ? String(rule.questionId) : '';
    const tagId = rule?.tagId != null ? String(rule.tagId) : '';
    if (!questionId || !tagId) continue;
    const expected = String(rule.equals ?? '').trim().toLowerCase();
    if (!expected) continue;
    const raw = answers[questionId];
    const values = Array.isArray(raw) ? raw : [raw];
    const hit = values.some((v) => String(v ?? '').trim().toLowerCase() === expected);
    if (hit) ids.add(tagId);
  }
  return [...ids];
}

function mapLinkRowsToTagsByInquiry(linkRows) {
  const byInquiry = new Map();
  for (const row of linkRows || []) {
    const inquiryId = row.service_inquiry_id;
    const tagRow = row.firm_inquiry_tags;
    if (!inquiryId || !tagRow) continue;
    const list = byInquiry.get(inquiryId) || [];
    list.push({
      id: tagRow.id,
      name: tagRow.name,
      colorHex: tagRow.color_hex || '#0F2942',
    });
    byInquiry.set(inquiryId, list);
  }
  return byInquiry;
}

const VALID_STATUSES = ['LEAD_CAPTURED', 'NEW', 'CONTACTED', 'DOCS_REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

/** Chave estável para evitar pedidos de documento duplicados (tag ou título normalizado). */
function documentDedupeKey({ tag, title }) {
  const t = String(tag || '')
    .trim()
    .toLowerCase();
  if (t && !t.startsWith('pend_')) return `tag:${t}`;
  return `title:${String(title || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()}`;
}

/** Mantém o primeiro de cada documento; ignora repetições por tag/título. */
function dedupeDocumentRequests(items) {
  const seen = new Set();
  const out = [];
  for (const item of items || []) {
    if (item.kind && item.kind !== 'document') {
      out.push(item);
      continue;
    }
    const key = documentDedupeKey(item);
    if (!key || key === 'title:') {
      out.push(item);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

// Ciclo de vida do access_token do mini-portal (ver especificação da sessão, v8):
// tecto generoso desde a submissão (cobre um processo lento sem expirar por engano),
// apertado para uma janela curta assim que a ServiceInquiry fica concluída/cancelada.
const ACCESS_TOKEN_TTL_MS = 180 * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_GRACE_MS = 30 * 24 * 60 * 60 * 1000;

async function enrichForList(firmId, inquiries) {
  const serviceIds = [...new Set(inquiries.map((i) => i.serviceId).filter(Boolean))];
  const services = await accountingServicesRepository.findByIdsForFirm(serviceIds, firmId);
  const serviceById = new Map(services.map((s) => [s.id, s]));
  const linkRows = await firmInquiryTagsRepository.listLinksForInquiries(
    firmId,
    inquiries.map((i) => i.id),
  );
  const tagsByInquiry = mapLinkRowsToTagsByInquiry(linkRows);

  const enriched = [];
  for (const inquiry of inquiries) {
    enriched.push({
      ...inquiry,
      serviceName: serviceById.get(inquiry.serviceId)?.name || null,
      requesterName: await requesterNameForInquiry(inquiry),
      tags: tagsByInquiry.get(inquiry.id) || [],
    });
  }
  return enriched;
}

async function list({ firmId, status, serviceId, tagId }) {
  if (status && !VALID_STATUSES.includes(status)) throw new AppError('Estado inválido', 400);
  let items = await serviceInquiriesRepository.listByFirm(firmId, { status, serviceId });
  const enriched = await enrichForList(firmId, items);
  if (tagId) {
    return { items: enriched.filter((i) => (i.tags || []).some((t) => t.id === tagId)) };
  }
  return { items: enriched };
}

async function countUnseen({ firmId }) {
  const count = await serviceInquiriesRepository.countUnseenByFirm(firmId);
  return { count };
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
  let inquiry = await serviceInquiriesRepository.findByIdForFirm(id, firmId);
  if (!inquiry) throw new AppError('Solicitação não encontrada', 404);

  // Abrir o detalhe marca como vista → o badge em Solicitações diminui.
  if (!inquiry.staffSeenAt) {
    inquiry = await serviceInquiriesRepository.updateRow(id, firmId, {
      staffSeenAt: new Date().toISOString(),
    });
  }

  const service = await accountingServicesRepository.findByIdForFirm(inquiry.serviceId, firmId);
  const requesterName = await requesterNameForInquiry(inquiry);
  const requests = await serviceInquiryRequestsRepository.listByInquiry(inquiry.id, firmId);
  const consultation = inquiry.consultationId
    ? await consultationsRepository.findByIdForFirm(inquiry.consultationId, firmId)
    : null;
  const history = await auditRepository.listByEntity({ firmId, entityType: 'service_inquiry', entityId: inquiry.id });

  // Documentos 'manual' que as respostas activaram mas que a contabilista ainda
  // não pediu — recalculado a cada leitura (não materializado, ver
  // normalizeDocumentRequirements) e filtrado contra o que já existe no checklist,
  // para nunca sugerir de novo algo que ela já pediu (ou que o cliente já enviou).
  let suggestedDocuments = [];
  if (service) {
    const alreadyRequestedTags = new Set(requests.filter((r) => r.tag).map((r) => r.tag));
    const { manual } = accountingServicesService.splitDocumentsByTiming(
      accountingServicesService.resolveRequiredDocuments(service, inquiry.answers),
    );
    suggestedDocuments = manual.filter((d) => !alreadyRequestedTags.has(d.tag));
  }

  const linkRows = await firmInquiryTagsRepository.listLinksForInquiries(firmId, [inquiry.id]);
  const tags = mapLinkRowsToTagsByInquiry(linkRows).get(inquiry.id) || [];

  return {
    inquiry: {
      ...inquiry,
      serviceName: service?.name || null,
      requesterName,
      tags,
      consultation: consultation
        ? { id: consultation.id, scheduledAt: consultation.scheduledAt, status: consultation.status }
        : null,
    },
    checklist: requests.map(toChecklistItem),
    suggestedDocuments,
    history,
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

  const inquiry = Object.keys(patch).length
    ? await serviceInquiriesRepository.updateRow(id, firmId, patch)
    : existing;

  if (Array.isArray(payload?.tagIds)) {
    const firmTags = await firmInquiryTagsRepository.listByFirm(firmId);
    const allowed = new Set(firmTags.map((t) => t.id));
    const tagIds = payload.tagIds.map(String).filter((tid) => allowed.has(tid));
    await firmInquiryTagsRepository.replaceLinksForInquiry(firmId, id, tagIds);
  }

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

  const linkRows = await firmInquiryTagsRepository.listLinksForInquiries(firmId, [id]);
  const tags = mapLinkRowsToTagsByInquiry(linkRows).get(id) || [];
  return { inquiry: { ...inquiry, tags } };
}

/**
 * Apaga uma solicitação. `service_inquiry_documents`/`service_inquiry_requests`
 * têm `ON DELETE CASCADE` (migrations 20260906000000/20260911000000) — os
 * registos filhos (checklist, documentos entregues) são removidos junto. Os
 * ficheiros já enviados para o Storage não são apagados aqui (fora de âmbito;
 * ficam órfãos, mesmo compromisso já aceite noutras remoções do sistema).
 */
async function remove({ firmId, id, actor }) {
  const existing = await serviceInquiriesRepository.findByIdForFirm(id, firmId);
  if (!existing) throw new AppError('Solicitação não encontrada', 404);

  await serviceInquiriesRepository.deleteRow(id, firmId);

  await auditRepository.writeAuditLog({
    firmId,
    actorRole: 'FIRM',
    actorId: actor?.id,
    action: 'service_inquiry.deleted',
    entityType: 'service_inquiry',
    entityId: id,
    metadata: { status: existing.status, serviceId: existing.serviceId },
  });

  return { ok: true };
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

const REQUEST_KINDS = new Set(['document', 'question']);

/**
 * A equipa pede mais uma coisa a uma ServiceInquiry já submetida — documento
 * extra ou pergunta em texto (ver especificação da sessão, v8, secção 2).
 * Reaproveita o mesmo access_token de sempre — não gera link novo.
 */
async function addServiceInquiryRequest({ firmId, inquiryId, actor, payload }) {
  const result = await addServiceInquiryRequestsBatch({
    firmId,
    inquiryId,
    actor,
    payload: { items: [payload] },
  });
  return { request: result.requests[0] };
}

/**
 * Pedido multi-item (Fase D): vários documentos/perguntas num único envio
 * e um único email ao cliente com a lista completa.
 */
async function addServiceInquiryRequestsBatch({ firmId, inquiryId, actor, payload }) {
  const inquiry = await serviceInquiriesRepository.findByIdForFirm(inquiryId, firmId);
  if (!inquiry) throw new AppError('Solicitação não encontrada', 404);
  if (TERMINAL_STATUSES.has(inquiry.status)) {
    throw new AppError(`Solicitação em estado terminal (${inquiry.status}) não pode receber novos pedidos`, 409);
  }

  const rawItems = Array.isArray(payload?.items) ? payload.items : [];
  if (!rawItems.length) throw new AppError('Adicione pelo menos um pedido', 400);
  if (rawItems.length > 20) throw new AppError('Máximo 20 itens por envio', 400);

  const validated = [];
  for (const item of rawItems) {
    const kind = String(item?.kind || '');
    if (!REQUEST_KINDS.has(kind)) throw new AppError('kind deve ser "document" ou "question"', 400);
    const title = String(item?.title || '').trim();
    if (!title) throw new AppError('Cada item precisa de um título', 400);
    const instructions = item?.instructions ? String(item.instructions).trim().slice(0, 2000) : null;
    const explicitTag = item?.tag ? String(item.tag).trim().slice(0, 60) : null;
    const tag = kind === 'document' ? explicitTag || `pend_${crypto.randomUUID()}` : null;
    validated.push({ kind, title, instructions, tag, explicitTag });
  }

  const existing = await serviceInquiryRequestsRepository.listByInquiry(inquiry.id, firmId);
  const existingKeys = new Set(
    existing.filter((r) => r.kind === 'document').map((r) => documentDedupeKey(r)),
  );

  const normalized = [];
  for (const item of validated) {
    if (item.kind === 'document') {
      const key = documentDedupeKey({ tag: item.explicitTag || null, title: item.title });
      if (existingKeys.has(key) || normalized.some((n) => n.kind === 'document' && documentDedupeKey(n) === key)) {
        continue;
      }
      existingKeys.add(key);
    }
    normalized.push({
      kind: item.kind,
      title: item.title,
      instructions: item.instructions,
      tag: item.tag,
    });
  }

  if (!normalized.length) {
    throw new AppError('Esses documentos já foram pedidos ao cliente', 409, { code: 'DUPLICATE_REQUESTS' });
  }

  const created = await serviceInquiryRequestsRepository.createMany(
    normalized.map((item) => ({
      firmId,
      serviceInquiryId: inquiry.id,
      kind: item.kind,
      tag: item.tag,
      title: item.title,
      instructions: item.instructions,
      createdBy: actor?.id || null,
    })),
  );

  const hasDocument = normalized.some((i) => i.kind === 'document');
  if (hasDocument && !TERMINAL_STATUSES.has(inquiry.status) && inquiry.status !== 'DOCS_REQUESTED') {
    await serviceInquiriesRepository.updateRow(inquiry.id, firmId, { status: 'DOCS_REQUESTED' });
  }

  await auditRepository.writeAuditLog({
    firmId,
    actorRole: 'FIRM',
    actorId: actor?.id,
    action: 'service_inquiry.request_added',
    entityType: 'service_inquiry',
    entityId: inquiry.id,
    metadata: {
      count: created.length,
      items: created.map((r) => ({ requestId: r.id, kind: r.kind, title: r.title })),
    },
  });

  const { name: requesterName, email: requesterEmail } = await requesterContactForInquiry(inquiry);
  if (requesterEmail && inquiry.accessToken) {
    const [service, firm] = await Promise.all([
      accountingServicesRepository.findByIdForFirm(inquiry.serviceId, firmId),
      firmsRepository.findFirmById(firmId).catch(() => null),
    ]);
    void contabilNotifications
      .notifyLeadNewRequest({
        toEmail: requesterEmail,
        toName: requesterName,
        firmName: firm?.name,
        serviceName: interpolateServiceTemplate(service?.name),
        accessToken: inquiry.accessToken,
        items: created.map((r) => ({ title: r.title, kind: r.kind })),
      })
      .catch(() => {});
  }

  return { requests: created.map(toChecklistItem) };
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

/** Nome + email de contacto — usado para notificar o submissor de um pedido novo. */
async function requesterContactForInquiry(inquiry) {
  if (inquiry.leadId) {
    const lead = await leadsRepository.findByIdForFirm(inquiry.leadId, inquiry.firmId);
    return { name: lead?.name || null, email: lead?.email || null };
  }
  if (inquiry.clientId) {
    const client = await clientsRepository.findClientById(inquiry.firmId, inquiry.clientId);
    return { name: client?.displayName || client?.name || null, email: client?.email || null };
  }
  return { name: null, email: null };
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

  let existingInquiry = null;
  let identity = null;
  // Aceita intakeToken (novo) e leadAccessToken (legado FE).
  const leadToken = String(payload?.intakeToken || payload?.leadAccessToken || '').trim();
  if (leadToken) {
    existingInquiry = await serviceInquiriesRepository.findByAccessToken(leadToken);
    if (
      !existingInquiry ||
      String(existingInquiry.firmId) !== String(firm.id) ||
      String(existingInquiry.serviceId) !== String(service.id) ||
      existingInquiry.status !== 'LEAD_CAPTURED'
    ) {
      throw new AppError('Sessão de formulário inválida ou já concluída', 410);
    }
    identity = {
      type: existingInquiry.clientId ? 'CLIENT' : 'LEAD',
      id: existingInquiry.clientId || existingInquiry.leadId,
    };
  }

  const name = String(payload?.name || '').trim();
  if (!name) throw new AppError('Nome é obrigatório', 400);
  const email = payload?.email ? String(payload.email).trim() : null;
  const phone = payload?.phone ? String(payload.phone).trim() : null;
  const taxId = payload?.taxId ? String(payload.taxId).trim() : null;
  if (!email) throw new AppError('Email é obrigatório', 400);

  const answers = payload?.answers && typeof payload.answers === 'object' && !Array.isArray(payload.answers)
    ? payload.answers
    : {};

  if (!identity) {
    identity = await leadsService.resolveIdentity(firm.id, {
      name,
      email,
      phone,
      taxId,
      source: 'PUBLIC_FORM',
      createdBy: null,
    });
  }

  // Defesa: se o FE perdeu o token (ex. sanitize accessToken), reutiliza o lead parcial.
  if (!existingInquiry) {
    existingInquiry = await serviceInquiriesRepository.findOpenLeadCapture({
      firmId: firm.id,
      serviceId: service.id,
      leadId: identity.type === 'LEAD' ? identity.id : null,
      clientId: identity.type === 'CLIENT' ? identity.id : null,
    });
  }

  // Agendamento — gratuito: bookAsClient → SCHEDULED.
  // Com payment_required: hold PENDING_PAYMENT + Checkout Connect (sem Calendar até paid).
  let bookedConsultation = null;
  let checkoutUrl = null;
  let paymentPublicToken = null;
  let holdExpiresAt = null;
  if (service.requiresBooking && payload?.scheduledAt) {
    if (service.paymentRequired) {
      const connectPaymentsService = require('../connect/connect-payments.service');
      const paid = await connectPaymentsService.bookAndPayAsClient({
        firmId: firm.id,
        clientId: identity.type === 'CLIENT' ? identity.id : undefined,
        leadId: identity.type === 'LEAD' ? identity.id : undefined,
        serviceId: service.id,
        scheduledAt: payload.scheduledAt,
        firmSlug: firm.slug || firmSlug,
        serviceSlug: service.slug || serviceSlug,
        customerEmail: email,
        customerName: name,
      });
      bookedConsultation = paid.consultation;
      checkoutUrl = paid.checkoutUrl;
      paymentPublicToken = paid.publicStatusToken;
      holdExpiresAt = paid.holdExpiresAt;
    } else {
      const booked = await bookingService.bookAsClient({
        firmId: firm.id,
        clientId: identity.type === 'CLIENT' ? identity.id : undefined,
        leadId: identity.type === 'LEAD' ? identity.id : undefined,
        serviceId: service.id,
        scheduledAt: payload.scheduledAt,
      });
      bookedConsultation = booked.consultation;
    }
  }

  const requiredDocuments = accountingServicesService.resolveRequiredDocuments(service, answers);
  const { immediate: immediateDocs } = accountingServicesService.splitDocumentsByTiming(requiredDocuments);
  const submittedAt = new Date().toISOString();
  // Com documentos immediate → DOCS_REQUESTED; senão IN_PROGRESS.
  const initialStatus = immediateDocs.length ? 'DOCS_REQUESTED' : 'IN_PROGRESS';

  let inquiry;
  if (existingInquiry) {
    inquiry = await serviceInquiriesRepository.updateRow(existingInquiry.id, firm.id, {
      answers,
      submittedAt,
      status: initialStatus,
      // Submissão completa = nova atenção mesmo se a equipa já tinha aberto o lead parcial.
      staffSeenAt: null,
    });
  } else {
    const accessToken = crypto.randomBytes(32).toString('hex');
    inquiry = await serviceInquiriesRepository.createRow({
      firmId: firm.id,
      serviceId: service.id,
      leadId: identity.type === 'LEAD' ? identity.id : null,
      clientId: identity.type === 'CLIENT' ? identity.id : null,
      notes: null,
      answers,
      submittedAt,
      accessToken,
      accessTokenExpiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString(),
      status: initialStatus,
    });
  }
  if (bookedConsultation) {
    await serviceInquiriesRepository.updateRow(inquiry.id, firm.id, { consultationId: bookedConsultation.id });
    inquiry.consultationId = bookedConsultation.id;
  }

  // Materializa checklist imediata (base + condicionais das respostas) para o portal /pedidos.
  // Não recria tags/títulos já presentes (ex.: re-submit ou lead parcial).
  if (immediateDocs.length) {
    const already = await serviceInquiryRequestsRepository.listByInquiry(inquiry.id, firm.id);
    const existingKeys = new Set(
      already.filter((r) => r.kind === 'document').map((r) => documentDedupeKey(r)),
    );
    const toCreate = dedupeDocumentRequests(
      immediateDocs.map((doc) => ({
        kind: 'document',
        tag: doc.tag,
        title: doc.title || doc.tag,
        instructions: doc.instructions || null,
      })),
    ).filter((doc) => !existingKeys.has(documentDedupeKey(doc)));

    if (toCreate.length) {
      await serviceInquiryRequestsRepository.createMany(
        toCreate.map((doc) => ({
          firmId: firm.id,
          serviceInquiryId: inquiry.id,
          kind: 'document',
          tag: doc.tag,
          title: doc.title,
          instructions: doc.instructions || null,
          createdBy: null,
        })),
      );
    }
  }

  const resolvedTagIds = resolveTagIdsFromRules(service.intakeTagRules, answers);
  if (resolvedTagIds.length) {
    const firmTags = await firmInquiryTagsRepository.listByFirm(firm.id);
    const allowed = new Set(firmTags.map((t) => t.id));
    const tagIds = resolvedTagIds.filter((tid) => allowed.has(tid));
    if (tagIds.length) {
      await firmInquiryTagsRepository.replaceLinksForInquiry(firm.id, inquiry.id, tagIds);
    }
  }

  await auditRepository.writeAuditLog({
    firmId: firm.id,
    actorRole: 'PUBLIC',
    actorId: null,
    action: 'service_inquiry.submitted',
    entityType: 'service_inquiry',
    entityId: inquiry.id,
    metadata: {
      serviceId: service.id,
      identityType: identity.type,
      suggestedDocuments: requiredDocuments.length,
      checklistDocuments: immediateDocs.length,
      booking: Boolean(bookedConsultation),
      paymentRequired: Boolean(service.paymentRequired),
      tagsApplied: resolvedTagIds.length,
    },
  });

  if (email && !checkoutUrl) {
    if (immediateDocs.length && inquiry.accessToken) {
      void contabilNotifications
        .notifyLeadIntakeChecklist({
          toEmail: email,
          toName: name,
          firmName: firm.name,
          serviceName: interpolateServiceTemplate(service.name),
          accessToken: inquiry.accessToken,
          documents: immediateDocs,
        })
        .catch(() => {});
    } else {
      void contabilNotifications
        .notifyLeadIntakeReceived({
          toEmail: email,
          toName: name,
          firmName: firm.name,
          serviceName: interpolateServiceTemplate(service.name),
        })
        .catch(() => {});
    }
  }
  const staffEmail = await resolveStaffNotifyEmail(firm.id, firm);
  if (staffEmail && !checkoutUrl) {
    void contabilNotifications
      .notifyFirmIntakeSubmitted({
        staffEmail,
        firmName: firm.name,
        requesterName: name,
        serviceName: interpolateServiceTemplate(service.name),
      })
      .catch(() => {});
  }

  return {
    inquiry,
    requiredDocuments,
    consultation: bookedConsultation,
    checkoutUrl,
    paymentPublicToken,
    holdExpiresAt,
    paymentRequired: Boolean(service.paymentRequired && checkoutUrl),
  };
}

/** Checklist pública pelo token do mini-portal — nunca devolve firm_id/lead_id/client_id. */
async function getByAccessToken(token) {
  const inquiry = await serviceInquiriesRepository.findByAccessToken(token);
  if (!inquiry) throw new AppError('Pedido não encontrado', 404, { code: 'NOT_FOUND' });

  const service = await accountingServicesRepository.findByIdForFirm(inquiry.serviceId, inquiry.firmId);
  const requests = await serviceInquiryRequestsRepository.listByInquiry(inquiry.id, inquiry.firmId);
  // Portal: esconde duplicados legados (mesmo documento pedido 2×).
  const checklist = dedupeDocumentRequests(requests.map(toChecklistItem));

  return {
    serviceName: interpolateServiceTemplate(service?.name) || null,
    status: inquiry.status,
    checklist,
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

  // Nova entrega do cliente → volta a contar no badge até a equipa reabrir.
  await serviceInquiriesRepository.updateRow(inquiry.id, inquiry.firmId, { staffSeenAt: null });

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
        serviceName: interpolateServiceTemplate(service?.name),
        documentTitle: request.title,
        allComplete,
      })
      .catch(() => {});
  }

  return { allComplete, checklist: allRequests.map(toChecklistItem) };
}

/** Resposta em texto a uma pendência do tipo "question", via o mini-portal por token (sem login). */
async function recordTextReply({ token, requestId, textReply }) {
  const inquiry = await serviceInquiriesRepository.findByAccessToken(token);
  if (!inquiry) throw new AppError('Pedido não encontrado', 404, { code: 'NOT_FOUND' });
  if (TERMINAL_STATUSES.has(inquiry.status)) {
    throw new AppError('Este pedido já foi encerrado', 409);
  }

  const request = await serviceInquiryRequestsRepository.findByIdForInquiry(requestId, inquiry.id, inquiry.firmId);
  if (!request || request.kind !== 'question' || request.status !== 'PENDING') {
    throw new AppError('Pergunta não reconhecida para este pedido', 400);
  }

  const reply = String(textReply || '').trim();
  if (!reply) throw new AppError('Resposta é obrigatória', 400);

  await serviceInquiryRequestsRepository.markAnswered(request.id, inquiry.firmId, { textReply: reply });

  await serviceInquiriesRepository.updateRow(inquiry.id, inquiry.firmId, { staffSeenAt: null });

  await auditRepository.writeAuditLog({
    firmId: inquiry.firmId,
    actorRole: 'PUBLIC',
    actorId: null,
    action: 'service_inquiry.request_answered',
    entityType: 'service_inquiry',
    entityId: inquiry.id,
    metadata: { requestId: request.id },
  });

  const service = await accountingServicesRepository.findByIdForFirm(inquiry.serviceId, inquiry.firmId);
  const firm = await firmsRepository.findFirmById(inquiry.firmId).catch(() => null);
  const staffEmail = firm ? await resolveStaffNotifyEmail(inquiry.firmId, firm) : null;
  if (staffEmail) {
    const requesterName = await requesterNameForInquiry(inquiry);
    void contabilNotifications
      .notifyFirmIntakeReplyReceived({
        staffEmail,
        firmName: firm?.name,
        requesterName,
        serviceName: interpolateServiceTemplate(service?.name),
        requestTitle: request.title,
      })
      .catch(() => {});
  }

  const allRequests = await serviceInquiryRequestsRepository.listByInquiry(inquiry.id, inquiry.firmId);
  return { checklist: allRequests.map(toChecklistItem) };
}

/**
 * Etapa 1 do formulário público — cria Lead + ServiceInquiry incompleta
 * (LEAD_CAPTURED) para não perder contacto se o visitante abandonar a meio.
 */
async function capturePublicLead({ firmSlug, serviceSlug, payload }) {
  const firm = await firmsRepository.findFirmBySlugOrLabel(firmSlug);
  if (!firm) throw new AppError('Pedido não encontrado', 404, { code: 'NOT_FOUND' });

  const services = await accountingServicesRepository.listByFirm(firm.id, { activeOnly: true });
  const service = services.find((s) => s.slug === serviceSlug && s.isPubliclyListed);
  if (!service) throw new AppError('Pedido não encontrado', 404, { code: 'NOT_FOUND' });

  const name = String(payload?.name || '').trim();
  if (!name) throw new AppError('Nome é obrigatório', 400);
  const email = payload?.email ? String(payload.email).trim() : null;
  if (!email) throw new AppError('Email é obrigatório', 400);
  const phone = payload?.phone ? String(payload.phone).trim() : null;
  const taxId = payload?.taxId ? String(payload.taxId).trim() : null;

  const identity = await leadsService.resolveIdentity(firm.id, {
    name,
    email,
    phone,
    taxId,
    source: 'PUBLIC_FORM',
    createdBy: null,
  });

  const accessToken = crypto.randomBytes(32).toString('hex');
  const inquiry = await serviceInquiriesRepository.createRow({
    firmId: firm.id,
    serviceId: service.id,
    leadId: identity.type === 'LEAD' ? identity.id : null,
    clientId: identity.type === 'CLIENT' ? identity.id : null,
    notes: null,
    answers: {},
    submittedAt: null,
    accessToken,
    accessTokenExpiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString(),
    status: 'LEAD_CAPTURED',
  });

  await auditRepository.writeAuditLog({
    firmId: firm.id,
    actorRole: 'PUBLIC',
    actorId: null,
    action: 'service_inquiry.lead_captured',
    entityType: 'service_inquiry',
    entityId: inquiry.id,
    metadata: { serviceId: service.id, identityType: identity.type },
  });

  return { inquiry, accessToken: inquiry.accessToken };
}

/**
 * A equipa confirma o agendamento ligado à solicitação e notifica o cliente por email.
 */
async function confirmConsultation({ firmId, inquiryId, actor }) {
  const inquiry = await serviceInquiriesRepository.findByIdForFirm(inquiryId, firmId);
  if (!inquiry) throw new AppError('Solicitação não encontrada', 404);
  if (!inquiry.consultationId) throw new AppError('Esta solicitação não tem agendamento', 400);
  if (TERMINAL_STATUSES.has(inquiry.status)) {
    throw new AppError('Solicitação encerrada — não é possível confirmar o agendamento', 409);
  }

  const consultation = await consultationsRepository.findByIdForFirm(inquiry.consultationId, firmId);
  if (!consultation) throw new AppError('Agendamento não encontrado', 404);
  if (consultation.status === 'CANCELLED') {
    throw new AppError('Este agendamento foi cancelado', 409);
  }

  const [service, firm] = await Promise.all([
    accountingServicesRepository.findByIdForFirm(inquiry.serviceId, firmId),
    firmsRepository.findFirmById(firmId).catch(() => null),
  ]);
  const { name: requesterName, email: requesterEmail } = await requesterContactForInquiry(inquiry);

  const when = consultation.scheduledAt
    ? new Date(consultation.scheduledAt).toLocaleString('pt-PT', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Europe/Lisbon',
      })
    : null;

  if (requesterEmail) {
    await contabilNotifications.notifyLeadConsultationConfirmed({
      toEmail: requesterEmail,
      toName: requesterName,
      firmName: firm?.name,
      serviceName: interpolateServiceTemplate(service?.name),
      when,
      accessToken: inquiry.accessToken,
    });
  }

  await auditRepository.writeAuditLog({
    firmId,
    actorRole: 'FIRM',
    actorId: actor?.id,
    action: 'service_inquiry.consultation_confirmed',
    entityType: 'service_inquiry',
    entityId: inquiry.id,
    metadata: { consultationId: consultation.id, scheduledAt: consultation.scheduledAt },
  });

  return {
    ok: true,
    consultation: {
      id: consultation.id,
      scheduledAt: consultation.scheduledAt,
      status: consultation.status,
    },
    emailed: Boolean(requesterEmail),
  };
}

module.exports = {
  list,
  countUnseen,
  getById,
  create,
  update,
  remove,
  revokeAccessToken,
  addServiceInquiryRequest,
  addServiceInquiryRequestsBatch,
  confirmConsultation,
  capturePublicLead,
  submitPublicIntake,
  getByAccessToken,
  recordDocumentDelivery,
  recordTextReply,
  getDocumentDownloadUrl,
  VALID_STATUSES,
};
