const { env } = require('../config/env');

function resolveRequestHost(req) {
  const forwarded = String(req?.headers?.['x-forwarded-host'] || '')
    .split(',')[0]
    .trim();
  const raw = forwarded || String(req?.headers?.host || '');
  return raw.split(':')[0].toLowerCase();
}

function shouldApplyCookieDomain(req) {
  if (!env.COOKIE_DOMAIN) return false;
  const host = resolveRequestHost(req);
  const baseDomain = env.COOKIE_DOMAIN.replace(/^\./, '').toLowerCase();
  return host === baseDomain || host.endsWith(`.${baseDomain}`);
}

function buildAuthCookieOptions(req) {
  const secure = env.isProduction || env.COOKIE_SECURE === true;
  const sameSite = env.COOKIE_SAMESITE;
  if (sameSite === 'none' && !secure) {
    throw new Error('Erro ao construir opções de cookie de autenticação.');
  }
  const options = {
    httpOnly: true,
    secure,
    sameSite,
    path: '/api',
  };
  if (shouldApplyCookieDomain(req)) {
    options.domain = env.COOKIE_DOMAIN;
  }
  return options;
}

function setRefreshTokenCookie(res, refreshToken, options = {}) {
  const rememberMe = Boolean(options?.rememberMe);
  res.cookie('refreshToken', refreshToken, {
    ...buildAuthCookieOptions(options?.req),
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
  });
}

function setAccessTokenCookie(res, accessToken, options = {}) {
  res.cookie('accessToken', accessToken, {
    ...buildAuthCookieOptions(options?.req),
    maxAge: env.ACCESS_TOKEN_MAX_AGE_MS,
  });
}

function clearRefreshTokenCookie(res, options = {}) {
  res.clearCookie('refreshToken', buildAuthCookieOptions(options?.req));
}

function clearAccessTokenCookie(res, options = {}) {
  res.clearCookie('accessToken', buildAuthCookieOptions(options?.req));
}

module.exports = {
  buildAuthCookieOptions,
  setRefreshTokenCookie,
  setAccessTokenCookie,
  clearRefreshTokenCookie,
  clearAccessTokenCookie,
};
