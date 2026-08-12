/**
 * Google Calendar — OAuth + Calendar API HTTP.
 * Reaproveita o mesmo OAuth Client (GOOGLE_OAUTH_CLIENT_ID/SECRET) da SSO,
 * com redirect_uri e scopes diferentes (offline + consent → refresh_token).
 */
const crypto = require('crypto');
const { env } = require('../../../config/env');

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE = 'https://oauth2.googleapis.com/revoke';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

/** Eventos + listar calendários + email (userinfo). */
const CALENDAR_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
].join(' ');

/** @deprecated use CALENDAR_SCOPES — mantido para testes/compat. */
const CALENDAR_SCOPE = CALENDAR_SCOPES;

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
    scope: CALENDAR_SCOPES,
    state,
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

async function revokeGoogleToken(token) {
  if (!token) return;
  try {
    await fetch(`${GOOGLE_REVOKE}?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch {
    // noop — desligar localmente é o que importa
  }
}

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

async function createCalendarEvent({ accessToken, calendarId, event }) {
  const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Google Calendar create event failed (${res.status}): ${text.slice(0, 200)}`);
    err.status = res.status;
    err.body = text;
    throw err;
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
    const err = new Error(`Google Calendar update event failed (${res.status}): ${text.slice(0, 200)}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return res.json();
}

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
    const err = new Error(`Google Calendar delete event failed (${res.status}): ${text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
}

/** Lista eventos no intervalo com paginação (evita busy incompleto além de 250). */
async function listCalendarEvents({ accessToken, calendarId, timeMinIso, timeMaxIso }) {
  const items = [];
  let pageToken = null;
  do {
    const params = new URLSearchParams({
      timeMin: timeMinIso,
      timeMax: timeMaxIso,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const res = await fetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) {
      const text = await res.text();
      const err = new Error(`Google Calendar list events failed (${res.status}): ${text.slice(0, 200)}`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    items.push(...(data.items || []));
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return items;
}

/** Lista calendários da conta (calendarList) — para o utilizador escolher qual usar. */
async function listCalendars({ accessToken }) {
  const items = [];
  let pageToken = null;
  do {
    const params = new URLSearchParams({ minAccessRole: 'writer', maxResults: '250' });
    if (pageToken) params.set('pageToken', pageToken);
    const res = await fetch(`${CALENDAR_API}/users/me/calendarList?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text();
      const err = new Error(`Google Calendar list calendars failed (${res.status}): ${text.slice(0, 200)}`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    for (const cal of data.items || []) {
      items.push({
        id: cal.id,
        summary: cal.summary || cal.id,
        primary: Boolean(cal.primary),
        accessRole: cal.accessRole || null,
      });
    }
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return items;
}

/** Procura evento por iCalUID — idempotência quando create OK mas falhou gravar google_event_id. */
async function findEventByICalUID({ accessToken, calendarId, iCalUID }) {
  const params = new URLSearchParams({ iCalUID, maxResults: '1' });
  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Google Calendar find by iCalUID failed (${res.status}): ${text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return (data.items && data.items[0]) || null;
}

function consultationICalUID(consultationId) {
  return `teglion-consultation-${consultationId}@teglion.com`;
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
  listCalendarEvents,
  listCalendars,
  findEventByICalUID,
  consultationICalUID,
  CALENDAR_SCOPE,
  CALENDAR_SCOPES,
};
