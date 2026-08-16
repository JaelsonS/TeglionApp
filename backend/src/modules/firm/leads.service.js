const { AppError } = require('../../middlewares/error.middleware');
const leadsRepository = require('../../db/supabase/repositories/leads.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const serviceInquiriesRepository = require('../../db/supabase/repositories/service-inquiries.repository');
const consultationsRepository = require('../../db/supabase/repositories/consultations.repository');
const firmInquiryTagsRepository = require('../../db/supabase/repositories/firm-inquiry-tags.repository');
const auditRepository = require('../../db/supabase/repositories/contabil/audit.repository');

const VALID_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'DISMISSED'];
const TERMINAL_STATUSES = new Set(['CONVERTED', 'DISMISSED']);

function normalizeEmail(email) {
  const trimmed = String(email || '').trim().toLowerCase();
  return trimmed || null;
}

function normalizeTaxId(taxId) {
  const digits = String(taxId || '').replace(/\D+/g, '');
  return digits || null;
}

/**
 * Resolução de identidade — sempre server-side, sempre scoped a firmId.
 * Ordem: NIF em clients → email em clients → NIF em leads → email em leads → cria Lead novo.
 * Nunca revela ao chamador qual ramo bateu além do {type, id} devolvido — quem usa isto
 * (ex.: um endpoint público futuro) não deve ecoar essa informação de volta ao utilizador.
 */
async function resolveIdentity(firmId, { name, email, phone, taxId, source, createdBy }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedTaxId = normalizeTaxId(taxId);

  if (normalizedTaxId) {
    const client = await clientsRepository.findClientByTaxId(firmId, normalizedTaxId);
    if (client) return { type: 'CLIENT', id: client.id };
  }
  if (normalizedEmail) {
    const client = await clientsRepository.findClientByEmailForFirm(normalizedEmail, firmId);
    if (client) return { type: 'CLIENT', id: client.id };
  }

  const existingLead = await leadsRepository.findMatchForFirm(firmId, {
    email: normalizedEmail,
    taxId: normalizedTaxId,
  });
  if (existingLead) return { type: 'LEAD', id: existingLead.id };

  const created = await leadsRepository.createRow({
    firmId,
    name: name || normalizedEmail || 'Sem nome',
    email: normalizedEmail,
    phone,
    taxId: normalizedTaxId,
    source: source || 'MANUAL',
    createdBy: createdBy || null,
  });
  return { type: 'LEAD', id: created.id };
}

async function attachTagsToLeads(firmId, leads) {
  if (!leads?.length) return leads || [];
  const leadIds = leads.map((l) => l.id);
  const linkRows = await firmInquiryTagsRepository.listLinksForLeads(firmId, leadIds);
  const tagsByLead = firmInquiryTagsRepository.mapLinkRowsToTagsByKey(linkRows, 'lead_id');
  return leads.map((lead) => ({
    ...lead,
    tags: tagsByLead.get(lead.id) || [],
  }));
}

async function list({ firmId, status }) {
  if (status && !VALID_STATUSES.includes(status)) throw new AppError('Estado inválido', 400);
  const items = await leadsRepository.listByFirm(firmId, { status });
  return { items: await attachTagsToLeads(firmId, items) };
}

async function getById({ firmId, id }) {
  const lead = await leadsRepository.findByIdForFirm(id, firmId);
  if (!lead) throw new AppError('Lead não encontrado', 404);
  const [withTags] = await attachTagsToLeads(firmId, [lead]);
  return { lead: withTags };
}

async function create({ firmId, actor, payload }) {
  const name = String(payload?.name || '').trim();
  if (!name) throw new AppError('Nome é obrigatório', 400);
  const email = normalizeEmail(payload?.email);
  const taxId = normalizeTaxId(payload?.taxId);
  if (!email && !payload?.phone) throw new AppError('Indique pelo menos email ou telefone', 400);

  // Evita duplicar — se já existir Client ou Lead com este email/NIF neste escritório, reaproveita.
  if (email || taxId) {
    const identity = await resolveIdentity(firmId, {
      name,
      email,
      phone: payload?.phone,
      taxId,
      source: 'MANUAL',
      createdBy: actor?.id,
    });
    if (identity.type === 'CLIENT') {
      throw new AppError('Já existe um cliente com este email/NIF — crie uma solicitação de serviço directamente no cliente', 409, {
        code: 'ALREADY_CLIENT',
        clientId: identity.id,
      });
    }
    const lead = await leadsRepository.findByIdForFirm(identity.id, firmId);
    return { lead, reused: true };
  }

  const lead = await leadsRepository.createRow({
    firmId,
    name,
    email,
    phone: payload?.phone,
    taxId,
    source: 'MANUAL',
    createdBy: actor?.id || null,
  });

  await auditRepository.writeAuditLog({
    firmId,
    actorRole: 'FIRM',
    actorId: actor?.id,
    action: 'lead.created',
    entityType: 'lead',
    entityId: lead.id,
    metadata: { source: 'MANUAL' },
  });

  return { lead, reused: false };
}

function assertValidTransition(fromStatus, toStatus) {
  if (!VALID_STATUSES.includes(toStatus)) throw new AppError('Estado inválido', 400);
  if (TERMINAL_STATUSES.has(fromStatus)) {
    throw new AppError(`Lead em estado terminal (${fromStatus}) não pode mudar de estado`, 409);
  }
}

async function update({ firmId, id, actor, payload }) {
  const existing = await leadsRepository.findByIdForFirm(id, firmId);
  if (!existing) throw new AppError('Lead não encontrado', 404);

  const patch = {};
  if (payload?.name !== undefined) {
    const name = String(payload.name).trim();
    if (!name) throw new AppError('Nome é obrigatório', 400);
    patch.name = name;
  }
  if (payload?.email !== undefined) patch.email = normalizeEmail(payload.email);
  if (payload?.phone !== undefined) patch.phone = payload.phone;
  if (payload?.taxId !== undefined) patch.taxId = normalizeTaxId(payload.taxId);
  if (payload?.consentMarketing !== undefined) patch.consentMarketing = Boolean(payload.consentMarketing);
  if (payload?.status !== undefined) {
    assertValidTransition(existing.status, payload.status);
    patch.status = payload.status;
  }

  const lead =
    Object.keys(patch).length > 0
      ? await leadsRepository.updateRow(id, firmId, patch)
      : existing;

  if (Array.isArray(payload?.tagIds)) {
    const tagIds = await firmInquiryTagsRepository.resolveAllowedTagIds(firmId, payload.tagIds);
    await firmInquiryTagsRepository.replaceLinksForLead(firmId, id, tagIds);
    // Reflecte nas solicitações ainda ligadas a este lead.
    const linkedInquiries = await serviceInquiriesRepository.listByFirm(firmId, { leadId: id });
    for (const inquiry of linkedInquiries || []) {
      await firmInquiryTagsRepository.replaceLinksForInquiry(firmId, inquiry.id, tagIds);
    }
  }

  if (patch.status && patch.status !== existing.status) {
    await auditRepository.writeAuditLog({
      firmId,
      actorRole: 'FIRM',
      actorId: actor?.id,
      action: 'lead.status_changed',
      entityType: 'lead',
      entityId: id,
      metadata: { from: existing.status, to: patch.status },
    });
  }

  const [withTags] = await attachTagsToLeads(firmId, [lead]);
  return { lead: withTags };
}

/**
 * Conversão Lead → Client — sempre manual, sempre auditada (secção 3.2 da spec).
 * Repointa todas as ServiceInquiries do Lead para o Client novo, atomicamente do
 * ponto de vista lógico (cria client, marca lead convertido, repointa inquiries —
 * se algum passo falhar a meio, fica em estado intermédio detectável por auditoria,
 * não há transação multi-tabela no Supabase JS client).
 */
async function convertToClient({ firmId, id, actor }) {
  const lead = await leadsRepository.findByIdForFirm(id, firmId);
  if (!lead) throw new AppError('Lead não encontrado', 404);
  if (lead.status === 'CONVERTED') throw new AppError('Lead já foi convertido', 409);
  if (lead.status === 'DISMISSED') throw new AppError('Lead descartado não pode ser convertido', 409);

  const client = await clientsRepository.createClient({
    firmId,
    displayName: lead.name,
    email: lead.email,
    phone: lead.phone,
    taxId: lead.taxId,
    metadata: {},
    assignedStaffId: null,
  });

  const converted = await leadsRepository.markConverted(id, firmId, client.id);
  const reassigned = await serviceInquiriesRepository.reassignLeadToClient(firmId, id, client.id);
  const consultationsReassigned = await consultationsRepository.reassignLeadToClient(firmId, id, client.id);
  await firmInquiryTagsRepository.copyLeadTagsToClient(firmId, id, client.id);

  await auditRepository.writeAuditLog({
    firmId,
    actorRole: 'FIRM',
    actorId: actor?.id,
    action: 'lead.converted',
    entityType: 'lead',
    entityId: id,
    metadata: {
      clientId: client.id,
      serviceInquiriesReassigned: reassigned.length,
      consultationsReassigned: consultationsReassigned.length,
    },
  });

  const tagLinkRows = await firmInquiryTagsRepository.listLinksForClients(firmId, [client.id]);
  const tags =
    firmInquiryTagsRepository.mapLinkRowsToTagsByKey(tagLinkRows, 'client_id').get(client.id) || [];

  return {
    lead: converted,
    client: { ...client, tags },
    serviceInquiriesReassigned: reassigned.length,
    consultationsReassigned: consultationsReassigned.length,
  };
}

module.exports = {
  resolveIdentity,
  list,
  getById,
  create,
  update,
  convertToClient,
  VALID_STATUSES,
};
