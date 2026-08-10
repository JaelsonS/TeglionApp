const { AppError } = require('../../middlewares/error.middleware');
const consultationsRepository = require('../../db/supabase/repositories/consultations.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const leadsRepository = require('../../db/supabase/repositories/leads.repository');

/** Nome do titular (Client ou Lead) — mesmo padrão de requesterNameForInquiry em service-inquiries.service.js. */
async function holderNameForConsultation(firmId, consultation) {
  if (consultation.leadId) {
    const lead = await leadsRepository.findByIdForFirm(consultation.leadId, firmId);
    return lead?.name || null;
  }
  if (consultation.clientId) {
    const client = await clientsRepository.findClientById(firmId, consultation.clientId);
    return client?.displayName || client?.name || null;
  }
  return null;
}

async function listConsultations({ firmId, clientId, from, to }) {
  const items = await consultationsRepository.listConsultations({
    firmId,
    clientId,
    from,
    to,
  });
  const enriched = [];
  for (const item of items) {
    enriched.push({ ...item, holderName: await holderNameForConsultation(firmId, item) });
  }
  return enriched;
}

async function createConsultation({ firmId, clientId, staffId, title, scheduledAt, durationMinutes, notes }) {
  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404);
  if (!title || !scheduledAt) throw new AppError('Título e data são obrigatórios', 400);
  const normalizedTitle = String(title).trim();
  const duplicate = await consultationsRepository.findRecentDuplicateConsultation({
    firmId,
    clientId,
    staffId,
    title: normalizedTitle,
    scheduledAt,
  });
  if (duplicate) {
    return { consultation: duplicate };
  }
  const consultation = await consultationsRepository.createConsultation({
    firmId,
    clientId,
    staffId,
    title: normalizedTitle,
    scheduledAt,
    durationMinutes,
    notes,
  });
  return { consultation };
}

async function updateConsultation({ firmId, id, patch }) {
  const consultation = await consultationsRepository.updateConsultation(id, firmId, patch);
  if (!consultation) throw new AppError('Consulta não encontrada', 404);
  return { consultation };
}

module.exports = { listConsultations, createConsultation, updateConsultation };
