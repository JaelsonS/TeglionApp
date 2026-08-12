/**
 * Push de consultations para o Google Calendar.
 * Nunca deve bloquear o fluxo de agendamento — chamadores usam fire-and-forget.
 */
const googleCalendarConnectionsRepository = require('../../../db/supabase/repositories/google-calendar-connections.repository');
const consultationsRepository = require('../../../db/supabase/repositories/consultations.repository');
const googleCalendarService = require('./google-calendar.service');
const connectionsService = require('./google-calendar-connections.service');
const { logger } = require('../../../utils/logger');

const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientError(err) {
  const status = Number(err?.status);
  if (status === 429 || status >= 500) return true;
  const msg = String(err?.message || '');
  return /ECONNRESET|ETIMEDOUT|fetch failed|network/i.test(msg);
}

function buildEventPayload(consultation, requesterName, timeZone) {
  const startMs = new Date(consultation.scheduledAt).getTime();
  const durationMs = (consultation.durationMinutes || 60) * 60 * 1000;
  const tz = timeZone || 'Europe/Lisbon';
  const iCalUID = googleCalendarService.consultationICalUID(consultation.id);
  return {
    summary: requesterName ? `${consultation.title} — ${requesterName}` : consultation.title,
    description: 'Agendado via Teglion.',
    start: { dateTime: new Date(startMs).toISOString(), timeZone: tz },
    end: { dateTime: new Date(startMs + durationMs).toISOString(), timeZone: tz },
    iCalUID,
  };
}

async function markSync(firmId, consultationId, patch) {
  try {
    await consultationsRepository.updateConsultation(consultationId, firmId, patch);
  } catch (err) {
    logger.safe.warn('[google-calendar] falha ao gravar sync status', {
      consultationId,
      message: err?.message,
    });
  }
}

async function syncOnce({ firmId, consultation, requesterName, timeZone }) {
  if (consultation.status === 'PENDING_PAYMENT') {
    await markSync(firmId, consultation.id, {
      googleSyncStatus: 'skipped',
      googleSyncError: 'pending_payment',
    });
    return { synced: false, reason: 'pending_payment' };
  }

  if (!consultation.staffId) {
    await markSync(firmId, consultation.id, {
      googleSyncStatus: 'skipped',
      googleSyncError: 'no_staff_assigned',
    });
    return { synced: false, reason: 'no_staff_assigned' };
  }

  const connection = await googleCalendarConnectionsRepository.findByStaffUser(firmId, consultation.staffId);
  if (!connection) {
    await markSync(firmId, consultation.id, {
      googleSyncStatus: 'skipped',
      googleSyncError: 'not_connected',
    });
    return { synced: false, reason: 'not_connected' };
  }

  if (connection.authStatus === 'needs_reconnect') {
    await markSync(firmId, consultation.id, {
      googleSyncStatus: 'failed',
      googleSyncError: 'needs_reconnect',
    });
    return { synced: false, reason: 'needs_reconnect' };
  }

  const accessToken = await connectionsService.getValidAccessToken(connection);
  const calendarId = connection.calendarId || 'primary';

  if (consultation.status === 'CANCELLED') {
    if (!consultation.googleEventId) {
      await markSync(firmId, consultation.id, {
        googleSyncStatus: 'skipped',
        googleSyncError: 'nothing_to_cancel',
      });
      return { synced: false, reason: 'nothing_to_cancel' };
    }
    await googleCalendarService.deleteCalendarEvent({
      accessToken,
      calendarId,
      eventId: consultation.googleEventId,
    });
    await consultationsRepository.updateConsultation(consultation.id, firmId, {
      googleEventId: null,
      googleSyncStatus: 'synced',
      googleSyncError: null,
      googleSyncedAt: new Date().toISOString(),
    });
    return { synced: true, action: 'deleted' };
  }

  const event = buildEventPayload(consultation, requesterName, timeZone);

  if (consultation.googleEventId) {
    try {
      await googleCalendarService.updateCalendarEvent({
        accessToken,
        calendarId,
        eventId: consultation.googleEventId,
        event: {
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
        },
      });
      await markSync(firmId, consultation.id, {
        googleSyncStatus: 'synced',
        googleSyncError: null,
        googleSyncedAt: new Date().toISOString(),
      });
      return { synced: true, action: 'updated' };
    } catch (err) {
      // Evento apagado no Google → recriar em vez de falhar para sempre.
      if (Number(err?.status) === 404 || Number(err?.status) === 410) {
        consultation = { ...consultation, googleEventId: null };
      } else {
        throw err;
      }
    }
  }

  if (!consultation.googleEventId) {
    const existing = await googleCalendarService.findEventByICalUID({
      accessToken,
      calendarId,
      iCalUID: event.iCalUID,
    });
    if (existing?.id) {
      await googleCalendarService.updateCalendarEvent({
        accessToken,
        calendarId,
        eventId: existing.id,
        event: {
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
        },
      });
      await consultationsRepository.updateConsultation(consultation.id, firmId, {
        googleEventId: existing.id,
        googleSyncStatus: 'synced',
        googleSyncError: null,
        googleSyncedAt: new Date().toISOString(),
      });
      return { synced: true, action: 'recovered' };
    }

    let created;
    try {
      created = await googleCalendarService.createCalendarEvent({
        accessToken,
        calendarId,
        event,
      });
    } catch (err) {
      if (Number(err?.status) === 409) {
        const recovered = await googleCalendarService.findEventByICalUID({
          accessToken,
          calendarId,
          iCalUID: event.iCalUID,
        });
        if (recovered?.id) {
          await consultationsRepository.updateConsultation(consultation.id, firmId, {
            googleEventId: recovered.id,
            googleSyncStatus: 'synced',
            googleSyncError: null,
            googleSyncedAt: new Date().toISOString(),
          });
          return { synced: true, action: 'recovered' };
        }
      }
      throw err;
    }

    await consultationsRepository.updateConsultation(consultation.id, firmId, {
      googleEventId: created.id,
      googleSyncStatus: 'synced',
      googleSyncError: null,
      googleSyncedAt: new Date().toISOString(),
    });
    return { synced: true, action: 'created' };
  }

  return { synced: false, reason: 'noop' };
}

async function syncConsultationToGoogle({ firmId, consultation, requesterName, timeZone }) {
  let lastErr = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await syncOnce({ firmId, consultation, requesterName, timeZone });
    } catch (err) {
      lastErr = err;
      if (connectionsService.isInvalidGrantError(err)) {
        if (consultation.staffId) {
          const connection = await googleCalendarConnectionsRepository.findByStaffUser(
            firmId,
            consultation.staffId,
          );
          if (connection?.id) {
            await googleCalendarConnectionsRepository.markNeedsReconnect(connection.id, err.message);
          }
        }
        await markSync(firmId, consultation.id, {
          googleSyncStatus: 'failed',
          googleSyncError: 'needs_reconnect',
        });
        return { synced: false, reason: 'needs_reconnect' };
      }
      if (attempt < MAX_ATTEMPTS - 1 && isTransientError(err)) {
        await sleep(RETRY_BASE_MS * (attempt + 1));
        continue;
      }
      break;
    }
  }

  logger.safe.warn('[google-calendar] sync failed', {
    consultationId: consultation?.id,
    message: lastErr?.message,
  });
  await markSync(firmId, consultation.id, {
    googleSyncStatus: 'failed',
    googleSyncError: String(lastErr?.message || 'sync_failed').slice(0, 500),
  });
  return { synced: false, reason: 'error', error: lastErr?.message };
}

module.exports = { syncConsultationToGoogle, buildEventPayload };
