/**
 * Orquestração da ligação Google Calendar por staff.
 * Não importa booking.service (evita ciclo com availability → connections).
 */
const googleCalendarConnectionsRepository = require('../../../db/supabase/repositories/google-calendar-connections.repository');
const firmsRepository = require('../../../db/supabase/repositories/firms.repository');
const googleSsoService = require('../../auth/google/google-sso.service');
const googleCalendarService = require('./google-calendar.service');

const TOKEN_EXPIRY_SKEW_MS = 2 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isInvalidGrantError(err) {
  const msg = String(err?.message || err?.body || '');
  return /invalid_grant/i.test(msg) || /expired or revoked/i.test(msg) || Number(err?.status) === 401;
}

function readPublicSyncStaffId(firm) {
  const raw = firm?.settings?.booking?.googleCalendarStaffUserId;
  if (typeof raw !== 'string') return null;
  const id = raw.trim();
  return UUID_RE.test(id) ? id : null;
}

async function getPublicSyncStaffId(firmId) {
  const firm = await firmsRepository.findFirmById(firmId);
  return readPublicSyncStaffId(firm);
}

async function writePublicSyncStaffId(firmId, staffUserIdOrNull) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) return null;
  const prev = firm.settings?.booking && typeof firm.settings.booking === 'object' ? firm.settings.booking : {};
  const next = { ...prev, googleCalendarStaffUserId: staffUserIdOrNull };
  await firmsRepository.mergeSettingsKey(firmId, 'booking', next);
  return next;
}

async function getStatus({ firmId, staffUserId }) {
  const connection = await googleCalendarConnectionsRepository.findByStaffUser(firmId, staffUserId);
  const publicSyncStaffId = await getPublicSyncStaffId(firmId);
  return {
    connected: Boolean(connection),
    authStatus: connection?.authStatus || null,
    googleEmail: connection?.googleEmail || null,
    calendarId: connection?.calendarId || null,
    calendarSummary: connection?.calendarSummary || null,
    lastAuthError: connection?.lastAuthError || null,
    publicSyncEnabled: Boolean(publicSyncStaffId && publicSyncStaffId === staffUserId),
    publicSyncStaffUserId: publicSyncStaffId,
  };
}

async function ensurePublicSyncAssignee({ firmId, staffUserId }) {
  const current = await getPublicSyncStaffId(firmId);
  if (current) return current;
  await writePublicSyncStaffId(firmId, staffUserId);
  return staffUserId;
}

async function completeConnection({ firmId, staffUserId, code }) {
  const tokens = await googleCalendarService.exchangeCalendarCode(code);
  if (!tokens.refresh_token) {
    throw new Error(
      'Google não devolveu refresh_token — tente desconectar a app em myaccount.google.com/permissions e ligar de novo',
    );
  }
  const profile = await googleSsoService.fetchGoogleUserInfo(tokens.access_token);
  const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  const existing = await googleCalendarConnectionsRepository.findByStaffUser(firmId, staffUserId);

  await googleCalendarConnectionsRepository.upsertConnection({
    firmId,
    staffUserId,
    googleEmail: profile?.email || null,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiresAt,
    calendarId: existing?.calendarId || 'primary',
    calendarSummary: existing?.calendarSummary || (existing ? null : 'Principal'),
    authStatus: 'ok',
    lastAuthError: null,
  });

  await ensurePublicSyncAssignee({ firmId, staffUserId });

  return { googleEmail: profile?.email || null };
}

async function disconnect({ firmId, staffUserId }) {
  const connection = await googleCalendarConnectionsRepository.findByStaffUser(firmId, staffUserId);
  if (!connection) return { disconnected: false };
  await googleCalendarService.revokeGoogleToken(connection.refreshToken);
  await googleCalendarConnectionsRepository.deleteConnection(firmId, staffUserId);

  const publicSyncStaffId = await getPublicSyncStaffId(firmId);
  if (publicSyncStaffId === staffUserId) {
    await writePublicSyncStaffId(firmId, null);
  }
  return { disconnected: true };
}

async function getValidAccessToken(connection) {
  const expiresAt = new Date(connection.tokenExpiresAt).getTime();
  if (Number.isFinite(expiresAt) && expiresAt - TOKEN_EXPIRY_SKEW_MS > Date.now()) {
    return connection.accessToken;
  }
  try {
    const tokens = await googleCalendarService.refreshAccessToken(connection.refreshToken);
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    await googleCalendarConnectionsRepository.updateAccessToken(connection.id, {
      accessToken: tokens.access_token,
      tokenExpiresAt,
    });
    return tokens.access_token;
  } catch (err) {
    if (isInvalidGrantError(err) && connection.id) {
      await googleCalendarConnectionsRepository.markNeedsReconnect(connection.id, err.message);
    }
    throw err;
  }
}

async function listCalendarsForStaff({ firmId, staffUserId }) {
  const connection = await googleCalendarConnectionsRepository.findByStaffUser(firmId, staffUserId);
  if (!connection) {
    const err = new Error('Google Calendar não está ligado');
    err.status = 404;
    throw err;
  }
  if (connection.authStatus === 'needs_reconnect') {
    const err = new Error('Google Calendar precisa ser reconectado');
    err.code = 'GOOGLE_CALENDAR_NEEDS_RECONNECT';
    err.status = 409;
    throw err;
  }
  const accessToken = await getValidAccessToken(connection);
  return googleCalendarService.listCalendars({ accessToken });
}

async function selectCalendar({ firmId, staffUserId, calendarId, calendarSummary }) {
  if (!calendarId || typeof calendarId !== 'string') {
    const err = new Error('calendarId é obrigatório');
    err.status = 400;
    throw err;
  }
  const connection = await googleCalendarConnectionsRepository.findByStaffUser(firmId, staffUserId);
  if (!connection) {
    const err = new Error('Google Calendar não está ligado');
    err.status = 404;
    throw err;
  }
  const updated = await googleCalendarConnectionsRepository.updateSelectedCalendar(firmId, staffUserId, {
    calendarId: String(calendarId).trim(),
    calendarSummary: calendarSummary ? String(calendarSummary).trim().slice(0, 200) : null,
  });
  return {
    calendarId: updated.calendarId,
    calendarSummary: updated.calendarSummary,
  };
}

async function setPublicSync({ firmId, staffUserId, enabled }) {
  if (enabled) {
    const connection = await googleCalendarConnectionsRepository.findByStaffUser(firmId, staffUserId);
    if (!connection) {
      const err = new Error('Ligue o Google Calendar antes de activar a sincronização pública');
      err.status = 400;
      throw err;
    }
    await writePublicSyncStaffId(firmId, staffUserId);
    return { publicSyncEnabled: true };
  }
  const publicSyncStaffId = await getPublicSyncStaffId(firmId);
  if (publicSyncStaffId === staffUserId) {
    await writePublicSyncStaffId(firmId, null);
  }
  return { publicSyncEnabled: false };
}

module.exports = {
  getStatus,
  completeConnection,
  disconnect,
  getValidAccessToken,
  listCalendarsForStaff,
  selectCalendar,
  setPublicSync,
  isInvalidGrantError,
  ensurePublicSyncAssignee,
  getPublicSyncStaffId,
};
