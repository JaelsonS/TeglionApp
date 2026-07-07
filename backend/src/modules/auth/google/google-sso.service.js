/**
 * Google OAuth2 / OIDC — SSO para staff do escritório (fase 1).
 * Requer GOOGLE_OAUTH_CLIENT_ID e GOOGLE_OAUTH_CLIENT_SECRET.
 */
const crypto = require('crypto');
const { env } = require('../../../config/env');

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO = 'https://openidconnect.googleapis.com/v1/userinfo';

function isGoogleSsoEnabled() {
  return Boolean(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET);
}

function buildGoogleAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

function generateOAuthState() {
  return crypto.randomBytes(24).toString('hex');
}

async function exchangeGoogleCode(code) {
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URI,
    grant_type: 'authorization_code',
  });
  const res = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function fetchGoogleUserInfo(accessToken) {
  const res = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Google userinfo failed');
  return res.json();
}

async function loginOrLinkFirmUserFromGoogle(profile) {
  const email = String(profile?.email || '').trim().toLowerCase();
  if (!email || !profile.email_verified) {
    return { ok: false, reason: 'email_unverified' };
  }
  // Fase 1: devolve perfil — ligação à conta firm_users por email no controller de auth.
  return {
    ok: true,
    email,
    name: profile.name || email,
    googleSub: profile.sub,
  };
}

module.exports = {
  isGoogleSsoEnabled,
  buildGoogleAuthUrl,
  generateOAuthState,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  loginOrLinkFirmUserFromGoogle,
};
