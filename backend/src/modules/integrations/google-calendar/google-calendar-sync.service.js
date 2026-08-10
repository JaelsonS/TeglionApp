/**
 * Push de consultations para o Google Calendar (Fase Hb — ver plan file da
 * sessão, v3 secção L). Fonte de verdade continua a ser `consultations`;
 * google_event_id é só a chave de idempotência para saber se já existe um
 * evento a actualizar/apagar, ou se é preciso criar um novo.
 *
 * Só sincroniza quando a consultation tem staffId E esse staff tem uma
 * ligação Google Calendar activa — sem isso, é um no-op silencioso (não é
 * erro, é o comportamento esperado para a maioria das consultations até
 * toda a equipa ligar a conta).
 *
 * Nunca deve bloquear o fluxo de agendamento em si — todos os chamadores
 * devem invocar isto fire-and-forget (mesmo padrão dos emails
 * transaccionais em contabil-notifications.service.js).
 */
const googleCalendarConnectionsRepository = require('../../../db/supabase/repositories/google-calendar-connections.repository');
const consultationsRepository = require('../../../db/supabase/repositories/consultations.repository');
const googleCalendarService = require('./google-calendar.service');
const connectionsService = require('./google-calendar-connections.service');

function buildEventPayload(consultation, requesterName) {
  const startMs = new Date(consultation.scheduledAt).getTime();
  const durationMs = (consultation.durationMinutes || 60) * 60 * 1000;
  return {
    summary: requesterName ? `${consultation.title} — ${requesterName}` : consultation.title,
    description: 'Agendado via Teglion.',
    start: { dateTime: new Date(startMs).toISOString() },
    end: { dateTime: new Date(startMs + durationMs).toISOString() },
  };
}

/** Sincroniza uma consultation para o Google Calendar do staff atribuído — cria, actualiza ou apaga o evento consoante o estado. */
async function syncConsultationToGoogle({ firmId, consultation, requesterName }) {
  if (!consultation.staffId) return { synced: false, reason: 'no_staff_assigned' };

  const connection = await googleCalendarConnectionsRepository.findByStaffUser(firmId, consultation.staffId);
  if (!connection) return { synced: false, reason: 'not_connected' };

  const accessToken = await connectionsService.getValidAccessToken(connection);

  if (consultation.status === 'CANCELLED') {
    if (!consultation.googleEventId) return { synced: false, reason: 'nothing_to_cancel' };
    await googleCalendarService.deleteCalendarEvent({
      accessToken,
      calendarId: connection.calendarId,
      eventId: consultation.googleEventId,
    });
    await consultationsRepository.updateConsultation(consultation.id, firmId, { googleEventId: null });
    return { synced: true, action: 'deleted' };
  }

  const event = buildEventPayload(consultation, requesterName);

  if (consultation.googleEventId) {
    await googleCalendarService.updateCalendarEvent({
      accessToken,
      calendarId: connection.calendarId,
      eventId: consultation.googleEventId,
      event,
    });
    return { synced: true, action: 'updated' };
  }

  const created = await googleCalendarService.createCalendarEvent({
    accessToken,
    calendarId: connection.calendarId,
    event,
  });
  await consultationsRepository.updateConsultation(consultation.id, firmId, { googleEventId: created.id });
  return { synced: true, action: 'created' };
}

module.exports = { syncConsultationToGoogle };
