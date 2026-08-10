/**
 * Puxa os horários ocupados dos calendários Google ligados, para juntar à
 * disponibilidade calculada em booking.service.js (Fase Hc — ver plan file
 * da sessão, v3 secção L). Sem tabela nova: em vez de sincronizar e guardar
 * `calendar_busy_blocks`, consulta a API ao vivo com cache curto (TTL,
 * mesmo utilitário já usado em firm-dashboard.repository.js) — simples,
 * sem cron novo, "fresco o suficiente" para evitar sobreposição com a
 * agenda pessoal de quem está ligado.
 *
 * Bloqueia no pool partilhado do escritório (não por staff individual) —
 * mesmo modelo de disponibilidade que já existe hoje (um único pool de
 * slots, não agenda por pessoa). Se a equipa crescer a ponto de precisar de
 * disponibilidade por pessoa, é uma evolução à parte, não introduzida aqui.
 */
const googleCalendarConnectionsRepository = require('../../../db/supabase/repositories/google-calendar-connections.repository');
const connectionsService = require('./google-calendar-connections.service');
const googleCalendarService = require('./google-calendar.service');
const ttlCache = require('../../../utils/cache/ttl-cache');
const { logger } = require('../../../utils/logger');

const BUSY_BLOCKS_CACHE_TTL_SEC = 300;

function eventToRange(event) {
  const startRaw = event.start?.dateTime || event.start?.date;
  const endRaw = event.end?.dateTime || event.end?.date;
  if (!startRaw || !endRaw) return null;
  const start = new Date(startRaw).getTime();
  const end = new Date(endRaw).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return { start, end };
}

async function busyRangesForConnection(connection, timeMinIso, timeMaxIso) {
  const accessToken = await connectionsService.getValidAccessToken(connection);
  const events = await googleCalendarService.listCalendarEvents({
    accessToken,
    calendarId: connection.calendarId,
    timeMinIso,
    timeMaxIso,
  });
  return events
    .filter((e) => e.status !== 'cancelled' && e.transparency !== 'transparent')
    .map(eventToRange)
    .filter(Boolean);
}

/**
 * Horários ocupados de todas as contas Google ligadas do escritório, no
 * intervalo pedido. Nunca lança — falha aberta (devolve []) se o Google
 * estiver indisponível, para nunca derrubar a página pública de agendamento
 * por causa de uma integração externa opcional.
 */
async function getBusyRangesForFirm({ firmId, fromMs, toMs }) {
  const cacheKey = `gcal-busy:${firmId}:${Math.floor(fromMs / 60000)}:${Math.floor(toMs / 60000)}`;
  try {
    return await ttlCache.getOrSet(cacheKey, BUSY_BLOCKS_CACHE_TTL_SEC, async () => {
      const connections = await googleCalendarConnectionsRepository.listByFirm(firmId);
      if (!connections.length) return [];
      const timeMinIso = new Date(fromMs).toISOString();
      const timeMaxIso = new Date(toMs).toISOString();
      const perConnection = await Promise.all(
        connections.map((c) =>
          busyRangesForConnection(c, timeMinIso, timeMaxIso).catch((err) => {
            logger.safe.warn('[google-calendar] falha ao ler eventos, ignorando esta ligação', {
              connectionId: c.id,
              message: err?.message,
            });
            return [];
          }),
        ),
      );
      return perConnection.flat();
    });
  } catch (err) {
    logger.safe.warn('[google-calendar] getBusyRangesForFirm falhou, a disponibilidade segue sem bloqueio externo', {
      firmId,
      message: err?.message,
    });
    return [];
  }
}

module.exports = { getBusyRangesForFirm };
