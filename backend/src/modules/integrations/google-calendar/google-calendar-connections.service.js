/**
 * Orquestração da ligação Google Calendar por staff (Fase Ha) — separa a
 * mecânica OAuth pura (google-calendar.service.js) do que fazemos com o
 * resultado (guardar/ler/apagar a ligação), mesmo padrão de
 * google-sso.service.js (mecânica) + contabil-auth.service.js (orquestração).
 */
const googleCalendarConnectionsRepository = require('../../../db/supabase/repositories/google-calendar-connections.repository');
const googleSsoService = require('../../auth/google/google-sso.service');
const googleCalendarService = require('./google-calendar.service');

async function getStatus({ firmId, staffUserId }) {
  const connection = await googleCalendarConnectionsRepository.findByStaffUser(firmId, staffUserId);
  return {
    connected: Boolean(connection),
    googleEmail: connection?.googleEmail || null,
  };
}

/** Troca o code pelo par de tokens, lê o email da conta e grava a ligação (Fase Ha). */
async function completeConnection({ firmId, staffUserId, code }) {
  const tokens = await googleCalendarService.exchangeCalendarCode(code);
  if (!tokens.refresh_token) {
    // Acontece quando a conta já tinha autorizado antes e o Google não repete o
    // refresh_token — prompt=consent (já usado ao construir o auth URL) deveria
    // evitar isto, mas fica o erro explícito em vez de guardar uma ligação inútil.
    throw new Error('Google não devolveu refresh_token — tente desconectar a app em myaccount.google.com/permissions e ligar de novo');
  }
  const profile = await googleSsoService.fetchGoogleUserInfo(tokens.access_token);
  const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await googleCalendarConnectionsRepository.upsertConnection({
    firmId,
    staffUserId,
    googleEmail: profile?.email || null,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiresAt,
    calendarId: 'primary',
  });

  return { googleEmail: profile?.email || null };
}

async function disconnect({ firmId, staffUserId }) {
  const connection = await googleCalendarConnectionsRepository.findByStaffUser(firmId, staffUserId);
  if (!connection) return { disconnected: false };
  await googleCalendarService.revokeGoogleToken(connection.refreshToken);
  await googleCalendarConnectionsRepository.deleteConnection(firmId, staffUserId);
  return { disconnected: true };
}

// Renova com uma folga de 2 minutos antes do vencimento real — evita usar um
// access_token que expira a meio da chamada seguinte (Fase Hb).
const TOKEN_EXPIRY_SKEW_MS = 2 * 60 * 1000;

/** Devolve um access_token válido para a ligação, renovando junto do Google se necessário (Fase Hb). */
async function getValidAccessToken(connection) {
  const expiresAt = new Date(connection.tokenExpiresAt).getTime();
  if (Number.isFinite(expiresAt) && expiresAt - TOKEN_EXPIRY_SKEW_MS > Date.now()) {
    return connection.accessToken;
  }
  const tokens = await googleCalendarService.refreshAccessToken(connection.refreshToken);
  const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  await googleCalendarConnectionsRepository.updateAccessToken(connection.id, {
    accessToken: tokens.access_token,
    tokenExpiresAt,
  });
  return tokens.access_token;
}

module.exports = { getStatus, completeConnection, disconnect, getValidAccessToken };
