/**
 * Cookie assinado para concluir registo OAuth (Google) sem expor dados na URL.
 */
const crypto = require('crypto');
const { env } = require('../config/env');

const COOKIE_NAME = 'oauth_register_pending';
const TTL_MS = 15 * 60 * 1000;

function signingSecret() {
  return env.JWT_ACCESS_SECRET || env.DOCUMENTS_SIGNING_SECRET || 'dev-oauth-pending';
}

function signPayload(payload) {
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', signingSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', signingSecret()).update(data).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload?.exp || Date.now() > payload.exp) return null;
    if (!payload.email || !payload.googleSub) return null;
    return payload;
  } catch {
    return null;
  }
}

function buildPendingRegistration({ email, ownerName, googleSub, countryCode = 'PT' }) {
  return {
    email: String(email).trim().toLowerCase(),
    ownerName: String(ownerName || '').trim(),
    googleSub: String(googleSub),
    countryCode: String(countryCode || 'PT').toUpperCase().slice(0, 2),
    exp: Date.now() + TTL_MS,
  };
}

function setPendingRegistrationCookie(res, req, profile) {
  const payload = buildPendingRegistration(profile);
  const token = signPayload(payload);
  const { buildAuthCookieOptions } = require('./auth-cookies');
  res.cookie(COOKIE_NAME, token, {
    ...buildAuthCookieOptions(req),
    maxAge: TTL_MS,
    httpOnly: true,
  });
}

function readPendingRegistration(req) {
  const token = req.cookies?.[COOKIE_NAME];
  return verifyToken(token);
}

function clearPendingRegistrationCookie(res, req) {
  const { buildAuthCookieOptions } = require('./auth-cookies');
  res.clearCookie(COOKIE_NAME, buildAuthCookieOptions(req));
}

module.exports = {
  OAUTH_PENDING_COOKIE: COOKIE_NAME,
  setPendingRegistrationCookie,
  readPendingRegistration,
  clearPendingRegistrationCookie,
  verifyToken,
};
