/**
 * Token assinado para concluir o registo OAuth (Google).
 * Preferir cookie HttpOnly; header e query existem para fluxos multi-host.
 */
const crypto = require('crypto');
const { env } = require('../config/env');

const COOKIE_NAME = 'oauth_register_pending';
const HEADER_NAME = 'x-oauth-pending';
const TTL_MS = 15 * 60 * 1000;

function signingSecret() {
  const secret = env.JWT_ACCESS_SECRET || env.DOCUMENTS_SIGNING_SECRET;
  if (!secret) {
    if (env.isProduction) {
      throw new Error('OAuth pending signing secret is required');
    }
    return 'dev-oauth-pending';
  }
  return secret;
}

function signPayload(payload) {
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', signingSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const raw = String(token).trim();
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return null;
  const data = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = crypto.createHmac('sha256', signingSecret()).update(data).digest('base64url');
  if (sig.length !== expected.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
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

function createPendingRegistrationToken(profile) {
  return signPayload(buildPendingRegistration(profile));
}

function setPendingRegistrationCookie(res, req, profileOrToken) {
  const token =
    typeof profileOrToken === 'string' ? profileOrToken : createPendingRegistrationToken(profileOrToken);
  const { buildAuthCookieOptions } = require('./auth-cookies');
  res.cookie(COOKIE_NAME, token, {
    ...buildAuthCookieOptions(req),
    maxAge: TTL_MS,
    httpOnly: true,
  });
  return token;
}

function readPendingRegistration(req) {
  const fromCookie = verifyToken(req.cookies?.[COOKIE_NAME]);
  if (fromCookie) return fromCookie;

  const headerRaw = req.get?.(HEADER_NAME) || req.headers?.[HEADER_NAME];
  const fromHeader = verifyToken(headerRaw);
  if (fromHeader) return fromHeader;

  const fromQuery = verifyToken(req.query?.pending);
  if (fromQuery) return fromQuery;

  const fromBody = verifyToken(req.body?.pendingToken);
  if (fromBody) return fromBody;

  return null;
}

function clearPendingRegistrationCookie(res, req) {
  const { buildAuthCookieOptions } = require('./auth-cookies');
  res.clearCookie(COOKIE_NAME, buildAuthCookieOptions(req));
}

module.exports = {
  OAUTH_PENDING_COOKIE: COOKIE_NAME,
  OAUTH_PENDING_HEADER: HEADER_NAME,
  TTL_MS,
  setPendingRegistrationCookie,
  createPendingRegistrationToken,
  readPendingRegistration,
  clearPendingRegistrationCookie,
  verifyToken,
};
