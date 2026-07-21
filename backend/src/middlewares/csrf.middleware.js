/**
 * CSRF Middleware - Proteção contra Cross-Site Request Forgery
 *
 * Estratégia: Validar X-Requested-With header em requisições state-changing (POST/PATCH/DELETE)
 * Browsers enviam este header automaticamente em XMLHttpRequest, protegendo contra
 * ataques CSRF de <form> em sites maliciosos.
 *
 * ℹ️ NOTA: Cookies com SameSite=Lax/None já proporcionam proteção parcial.
 * Este middleware adiciona camada extra para máxima segurança.
 *
 * @see https://owasp.org/www-community/attacks/csrf
 */
const crypto = require('crypto');

const { env } = require('../config/env');
const { BRAND } = require('../config/brand');
const { logger } = require('../utils/logger');

const CSRF_COOKIE_NAME = 'csrfToken';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

function isLocalDevOrigin(origin) {
  if (!env.isDevelopment) return false;
  if (!origin) return false;
  return /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
}

function parseOrigin(value) {
  try {
    const parsed = new URL(String(value || ''));
    return {
      origin: parsed.origin,
      protocol: parsed.protocol,
      hostname: parsed.hostname.toLowerCase(),
    };
  } catch {
    return null;
  }
}

function matchesWildcardSubdomain(origin, pattern) {
  const rawPattern = String(pattern || '').trim();
  if (!rawPattern.includes('*')) return false;

  const wildcardMatch = rawPattern.match(/^(https?):\/\/\*\.([^/:]+)$/i);
  if (!wildcardMatch) return false;

  const [, protocol, domain] = wildcardMatch;
  const parsedOrigin = parseOrigin(origin);
  if (!parsedOrigin) return false;

  if (parsedOrigin.protocol !== `${String(protocol).toLowerCase()}:`) return false;

  const normalizedDomain = String(domain).toLowerCase();
  if (parsedOrigin.hostname === normalizedDomain) return false;
  return parsedOrigin.hostname.endsWith(`.${normalizedDomain}`);
}

function buildAllowedOrigins() {
  const list = Array.isArray(env.CORS_ORIGINS) ? env.CORS_ORIGINS : [];
  const criticalOrigins = [env.FRONTEND_URL, ...BRAND.productionOrigins];
  // Previews Vercel só em desenvolvimento — em produção use CORS_ORIGINS explícito se necessário
  if (!env.isProduction) {
    criticalOrigins.push('https://*.vercel.app');
  }
  const merged = Array.from(new Set([...criticalOrigins, ...list].filter(Boolean)));

  const exact = new Set();
  const wildcard = [];

  for (const item of merged) {
    if (String(item).includes('*')) {
      wildcard.push(String(item).trim());
      continue;
    }

    const parsed = parseOrigin(item);
    if (parsed?.origin) exact.add(parsed.origin);
  }

  return { exact, wildcard };
}

function isAllowedConfiguredOrigin(origin) {
  const parsed = parseOrigin(origin);
  if (!parsed?.origin) return false;

  const allowed = buildAllowedOrigins();
  if (allowed.exact.has(parsed.origin)) return true;
  return allowed.wildcard.some((pattern) => matchesWildcardSubdomain(parsed.origin, pattern));
}

function resolveOrigin(req) {
  const origin = req.get('origin');
  if (origin) return origin;
  const referer = req.get('referer');
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function hasAuthorizationHeader(req) {
  const authHeader = String(req.headers?.authorization || '').trim();
  if (authHeader.startsWith('Bearer ')) return true;
  if (req.get('X-Integration-Token')) return true;
  return false;
}

/** Pedidos AJAX da SPA — alguns WebViews/mobile omitiram Origin/Referrer mesmo com HTTPS. */
function looksLikeBrowserSpaAjax(req) {
  const v = String(req.get('x-requested-with') || '').toLowerCase();
  return v === 'xmlhttprequest';
}

function pathWithoutQuery(req) {
  const raw = req.originalUrl || req.url || req.path || '';
  return String(raw).split('?')[0];
}

/**
 * SPA em domínio A + API em domínio B: alguns browsers (Chrome iOS) não gravam/expõem cookie CSRF como “primeira parte”.
 * Mantemos Double Submit quando cookie+header existem; quando faltam, exigimos Origin referenciado na allowlist + AJAX SPA — CORS já bloqueia sites não autorizados a obter sessão com estas credenciais.
 */
function matchPublicCredentialedAuthPath(pathOnly) {
  if (pathOnly === '/api/contabil/auth/register-firm') return true;
  if (pathOnly === '/api/auth/register-firm') return true;
  if (pathOnly === '/api/auth/register-firm-google') return true;
  return /^\/api\/auth\/(login-firm|login-client|register-client-invite|register-firm|register-firm-google|refresh|recover|reset|validate-reset-token|reset-password)$/.test(
    pathOnly,
  );
}

function trustedSpaCanSkipCsrfCookieHeaderPair(req) {
  const pathOnly = pathWithoutQuery(req);
  if (!matchPublicCredentialedAuthPath(pathOnly)) return false;
  const method = String(req.method || '').toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return false;
  if (!looksLikeBrowserSpaAjax(req)) return false;
  const origin = resolveOrigin(req);
  if (!origin) return false;
  if (env.isDevelopment && isLocalDevOrigin(origin)) return true;
  return isAllowedConfiguredOrigin(origin);
}

/** Rotas públicas auth onde bloquear por falta de Origin quebra Safari/WKWebView e apps híbridos — CORS continua aplicável antes disto. */
function allowsAuthCredentialedPostWithoutOrigin(req) {
  const pathOnly = pathWithoutQuery(req);
  const okPath =
    /^\/api\/auth\/(login-firm|login-client|register-client-invite|register-firm|register-firm-google|refresh|recover|reset|validate-reset-token|reset-password)$/.test(
      pathOnly,
    ) || pathOnly === '/api/contabil/auth/register-firm';

  const method = String(req.method || '').toUpperCase();
  const stateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  return stateChanging && okPath && looksLikeBrowserSpaAjax(req);
}

function normalizeCookieDomain(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed.startsWith('.') ? trimmed.slice(1) : trimmed;
}

function shouldApplyCookieDomain(req) {
  if (!env.COOKIE_DOMAIN) return false;
  const host = String(req?.hostname || '').toLowerCase();
  if (!host) return false;
  const cookieDomain = normalizeCookieDomain(env.COOKIE_DOMAIN);
  if (!cookieDomain) return false;
  return host === cookieDomain || host.endsWith(`.${cookieDomain}`);
}

function buildCsrfCookieOptions(req) {
  const sameSite = env.COOKIE_SAMESITE;
  const secure = sameSite === 'none' ? true : env.COOKIE_SECURE;
  const options = {
    httpOnly: false,
    secure,
    sameSite,
    path: '/',
  };

  if (shouldApplyCookieDomain(req)) {
    options.domain = env.COOKIE_DOMAIN;
  }

  return {
    ...options,
  };
}

function createCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function safeCompare(a, b) {
  if (!a || !b) return false;
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

/**
 * CSRF Protection Middleware
 * Aplicar em rotas sensíveis (POST, PATCH, DELETE)
 *
 * Endpoints seguros (autenticadas + Authorization header): ✅ menor risco
 * Endpoints com cookies apenas: ⚠️ aplicar este middleware
 */
const csrfProtection = (req, res, next) => {
  // Skip GET e OPTIONS (não alteram estado)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip para chamadas com Authorization header (tokens) ou integrações — apenas se ALLOW_BEARER_AUTH.
  if (env.ALLOW_BEARER_AUTH && hasAuthorizationHeader(req)) {
    return next();
  }

  const origin = resolveOrigin(req);
  if (!origin) {
    if (!allowsAuthCredentialedPostWithoutOrigin(req)) {
      logger.warn(`[CSRF] Bloqueado: ${req.method} ${req.path} sem origin/referer`);
      return res.status(403).json({
        error: 'CSRF validation failed',
        code: 'CSRF_INVALID',
      });
    }
  } else if (!isLocalDevOrigin(origin)) {
    if (!isAllowedConfiguredOrigin(origin)) {
      logger.warn(`[CSRF] Bloqueado: origin inválido ${origin} em ${req.method} ${req.path}`);
      return res.status(403).json({
        error: 'CSRF validation failed',
        code: 'CSRF_INVALID',
      });
    }
  }

  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
  const csrfHeader = req.get(CSRF_HEADER_NAME);

  if (!csrfCookie || !csrfHeader) {
    if (trustedSpaCanSkipCsrfCookieHeaderPair(req) || allowsAuthCredentialedPostWithoutOrigin(req)) {
      return next();
    }
    logger.warn(`[CSRF] Bloqueado: ${req.method} ${req.path} sem token CSRF`);
    return res.status(403).json({
      error: 'CSRF validation failed',
      code: 'CSRF_INVALID',
    });
  }

  if (!safeCompare(csrfCookie, csrfHeader)) {
    logger.warn(`[CSRF] Bloqueado: token CSRF inválido em ${req.method} ${req.path}`);
    return res.status(403).json({
      error: 'CSRF validation failed',
      code: 'CSRF_INVALID',
    });
  }

  return next();
};

/**
 * CSRF Skip List
 * Endpoints que NÃO precisam de CSRF (público, webhook, etc.)
 */
const csrfSkipPaths = [
  /^\/api\/public\/.*/, // Público (geo, search, etc.)
  /^\/api\/checkout\/webhook.*/, // Stripe webhook (valida signature)
  /^\/api\/stripe\/webhook.*/, // Stripe webhook legado
  /^\/api\/public\/stripe\/webhook.*/, // Teglion Stripe webhook
  /^\/api\/webhook\/.*/, // Webhook WhatsApp 360dialog
  /^\/api\/webhooks\/.*/, // Webhooks gerais
  /^\/api\/health.*/, // Health check
];

/**
 * CSRF Middleware Wrapper - Aplica lógica de skip
 */
const csrfProtectionWithSkip = (req, res, next) => {
  const shouldSkip = csrfSkipPaths.some((pattern) => pattern.test(req.path));

  if (shouldSkip) {
    return next();
  }

  return csrfProtection(req, res, next);
};

const ensureCsrfCookie = (req, res, next) => {
  const existing = req.cookies?.[CSRF_COOKIE_NAME];
  if (existing) return next();

  const token = createCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, buildCsrfCookieOptions(req));
  return next();
};

/**
 * CSRF Token Response Middleware (Opcional)
 * Para clients que precisam de token CSRF explícito antes de fazer POST
 *
 * Uso:
 * 1. GET /api/csrf-token → retorna token
 * 2. POST /api/algum-endpoint com header X-CSRF-Token
 *
 * ℹ️ Atualmente não usamos token baseado em sessão (stateless API)
 * Se precisar, gerar token via session ou JWT claim.
 */
const generateCsrfToken = (req, res, next) => {
  const token = createCsrfToken();
  res.locals.csrfToken = token;
  res.cookie(CSRF_COOKIE_NAME, token, buildCsrfCookieOptions(req));
  next();
};

module.exports = {
  csrfProtection,
  csrfProtectionWithSkip,
  ensureCsrfCookie,
  generateCsrfToken,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
};
