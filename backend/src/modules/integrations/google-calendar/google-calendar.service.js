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

module.exports = {
  isGoogleCalendarConfigured,
  generateOAuthState,
  buildCalendarAuthUrl,
  exchangeCalendarCode,
  revokeGoogleToken,
  CALENDAR_SCOPE,
};
