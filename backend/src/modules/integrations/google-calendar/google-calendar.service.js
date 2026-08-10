/**
 * Google Calendar — ligar/desligar a conta de um membro da equipa (Fase Ha,
 * ver plan file da sessão, v3 secção L). Fonte de verdade continua a ser
 * `consultations`; esta fase só liga a conta, ainda não sincroniza nada.
 * Reaproveita o mesmo OAuth Client (GOOGLE_OAUTH_CLIENT_ID/SECRET) da SSO
 * (google-sso.service.js), com redirect_uri e scope diferentes — a SSO
 * autentica qualquer pessoa (openid email profile, access_type=online); isto
 * autoriza uma integração para um staff já autenticado no Teglion
 * (calendar.events, access_type=offline, para obter refresh_token).
 */
const crypto = require('crypto');
const { env } = require('../../../config/env');

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE = 'https://oauth2.googleapis.com/revoke';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

function isGoogleCalendarConfigured() {
  return Boolean(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET);
}

function generateOAuthState() {
  return crypto.randomBytes(24).toString('hex');
}

function buildCalendarAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALENDAR_REDIRECT_URI,
    response_type: 'code',
    scope: CALENDAR_SCOPE,
    state,
    // offline + consent: só assim o Google garante devolver um refresh_token
    // (sem isto, reconectar uma conta já autorizada antes não devolve nenhum).
    access_type: 'offline',
    prompt: 'consent',
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

async function exchangeCalendarCode(code) {
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_CALENDAR_REDIRECT_URI,
    grant_type: 'authorization_code',
  });
  const res = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar token exchange failed: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Revoga o token junto do Google — melhor esforço: se falhar, ainda assim apagamos a ligação localmente. */
async function revokeGoogleToken(token) {
  if (!token) return;
  try {
    await fetch(`${GOOGLE_REVOKE}?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch {
    // noop — desligar localmente é o que importa para o utilizador
  }
}

/** Troca o refresh_token por um access_token novo — chamado quando o access_token guardado expirou (Fase Hb). */
async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });
  const res = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar token refresh failed: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * Cria um evento no Google Calendar (Fase Hb — push de consultations para o
 * Calendar). Sempre com reminders desligados por omissão — o Google já
 * aplica os lembretes por defeito do calendário do utilizador, não
 * precisamos de duplicar.
 */
async function createCalendarEvent({ accessToken, calendarId, event }) {
  const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar create event failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function updateCalendarEvent({ accessToken, calendarId, eventId, event }) {
  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar update event failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** 404/410 conta como sucesso — o evento já não existe do lado do Google, exactamente o estado que queríamos. */
async function deleteCalendarEvent({ accessToken, calendarId, eventId }) {
  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const text = await res.text();
    throw new Error(`Google Calendar delete event failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

module.exports = {
  isGoogleCalendarConfigured,
  generateOAuthState,
  buildCalendarAuthUrl,
  exchangeCalendarCode,
  revokeGoogleToken,
  refreshAccessToken,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  CALENDAR_SCOPE,
};
