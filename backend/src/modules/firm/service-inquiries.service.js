const { AppError } = require('../../middlewares/error.middleware');
const serviceInquiriesRepository = require('../../db/supabase/repositories/service-inquiries.repository');
const leadsRepository = require('../../db/supabase/repositories/leads.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const auditRepository = require('../../db/supabase/repositories/contabil/audit.repository');

const VALID_STATUSES = ['NEW', 'CONTACTED', 'DOCS_REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

async function list({ firmId, status, serviceId }) {
  if (status && !VALID_STATUSES.includes(status)) throw new AppError('Estado inválido', 400);
  const items = await serviceInquiriesRepository.listByFirm(firmId, { status, serviceId });
  return { items };
}

async function getById({ firmId, id }) {
  const inquiry = await serviceInquiriesRepository.findByIdForFirm(id, firmId);
  if (!inquiry) throw new AppError('Solicitação não encontrada', 404);
  return { inquiry };
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

module.exports = { list, getById, create, update, VALID_STATUSES };
