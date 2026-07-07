const { AppError } = require('../../middlewares/error.middleware');
const consultationsRepository = require('../../db/supabase/repositories/consultations.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');

async function listConsultations({ firmId, clientId, from, to }) {
  return consultationsRepository.listConsultations({
    firmId,
    clientId,
    from,
    to,
  });
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
