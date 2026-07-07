const { env } = require('../../../config/env');
const {
  isGoogleSsoEnabled,
  buildGoogleAuthUrl,
  generateOAuthState,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  loginOrLinkFirmUserFromGoogle,
} = require('./google-sso.service');
const contabilAuth = require('../contabil-auth.service');
const {
  setRefreshTokenCookie,
  setAccessTokenCookie,
  buildAuthCookieOptions,
} = require('../../../utils/auth-cookies');
const {
  setPendingRegistrationCookie,
  readPendingRegistration,
  clearPendingRegistrationCookie,
} = require('../../../utils/oauth-pending-cookie');
const { logger } = require('../../../utils/logger');

const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_INTENT_COOKIE = 'oauth_intent';
const VALID_INTENTS = new Set(['login', 'register']);

function parseIntent(raw) {
  const value = String(raw || 'login').toLowerCase();
  return VALID_INTENTS.has(value) ? value : 'login';
}

function startGoogleLogin(req, res) {
  if (!isGoogleSsoEnabled()) {
    return res.status(503).json({ code: 'SSO_DISABLED', message: 'Login Google não configurado.' });
  }
  const intent = parseIntent(req.query.intent);
  const countryCode = String(req.query.countryCode || 'PT').toUpperCase().slice(0, 2);
  const state = generateOAuthState();
  const cookieOpts = {
    ...buildAuthCookieOptions(req),
    maxAge: 10 * 60 * 1000,
  };
  res.cookie(OAUTH_STATE_COOKIE, state, cookieOpts);
  res.cookie(OAUTH_INTENT_COOKIE, intent, cookieOpts);
  if (intent === 'register') {
    res.cookie('oauth_country', countryCode, cookieOpts);
  }
  return res.redirect(buildGoogleAuthUrl(state));
}

async function googleCallback(req, res) {
  const intent = parseIntent(req.cookies?.[OAUTH_INTENT_COOKIE]);
  const countryCode = String(req.cookies?.oauth_country || 'PT').toUpperCase().slice(0, 2);
  const loginUrl = `${env.FRONTEND_URL}/auth/firm/login`;
  const registerUrl = `${env.FRONTEND_URL}/auth/firm/register`;

  res.clearCookie(OAUTH_INTENT_COOKIE, buildAuthCookieOptions(req));
  res.clearCookie('oauth_country', buildAuthCookieOptions(req));

  if (!isGoogleSsoEnabled()) {
    return res.redirect(`${loginUrl}?error=sso_disabled`);
  }

  const { code, state, error } = req.query;
  if (error) {
    return res.redirect(`${intent === 'register' ? registerUrl : loginUrl}?error=google_denied`);
  }

  const savedState = req.cookies?.[OAUTH_STATE_COOKIE];
  res.clearCookie(OAUTH_STATE_COOKIE, buildAuthCookieOptions(req));
  if (!state || !savedState || state !== savedState) {
    return res.redirect(`${intent === 'register' ? registerUrl : loginUrl}?error=invalid_state`);
  }

  if (!code || typeof code !== 'string' || !String(code).trim()) {
    return res.redirect(`${intent === 'register' ? registerUrl : loginUrl}?error=sso_failed`);
  }

  try {
    const tokens = await exchangeGoogleCode(String(code).trim());
    const profile = await fetchGoogleUserInfo(tokens.access_token);
    const linked = await loginOrLinkFirmUserFromGoogle(profile);
    if (!linked.ok) {
      return res.redirect(`${intent === 'register' ? registerUrl : loginUrl}?error=email_unverified`);
    }

    const loginResult = await contabilAuth.loginFirmBySso({
      email: linked.email,
      req,
      provider: 'google',
      googleSub: linked.googleSub,
    });

    if (loginResult.ok) {
      setRefreshTokenCookie(res, loginResult.tokens.refreshToken, { req });
      setAccessTokenCookie(res, loginResult.tokens.accessToken, { req });
      if (loginResult.firmAccess?.hasAccess === false && loginResult.firmAccess.reason === 'TRIAL_EXPIRED') {
        return res.redirect(`${env.FRONTEND_URL}/app/firm/billing?sso=1`);
      }
      return res.redirect(`${env.FRONTEND_URL}/app/firm/dashboard?sso=1`);
    }

    if (loginResult.reason === 'account_not_found' && intent === 'register') {
      setPendingRegistrationCookie(res, req, {
        email: linked.email,
        ownerName: linked.name,
        googleSub: linked.googleSub,
        countryCode,
      });
      return res.redirect(`${env.FRONTEND_URL}/auth/firm/register/google`);
    }

    return res.redirect(`${loginUrl}?error=${loginResult.reason || 'account_not_found'}`);
  } catch (err) {
    logger.safe.warn('[google-sso] callback failed', { message: err?.message });
    return res.redirect(`${intent === 'register' ? registerUrl : loginUrl}?error=sso_failed`);
  }
}

function getPendingRegistration(req, res) {
  const pending = readPendingRegistration(req);
  if (!pending) {
    return res.status(404).json({ code: 'SSO_PENDING_NOT_FOUND', message: 'Sessão Google expirada. Tente novamente.' });
  }
  return res.json({
    email: pending.email,
    ownerName: pending.ownerName,
    countryCode: pending.countryCode || 'PT',
  });
}

function ssoStatus(_req, res) {
  return res.json({
    google: isGoogleSsoEnabled(),
    providers: isGoogleSsoEnabled() ? ['google'] : [],
  });
}

module.exports = {
  startGoogleLogin,
  googleCallback,
  getPendingRegistration,
  ssoStatus,
  readPendingRegistration,
  clearPendingRegistrationCookie,
};
