const crypto = require('crypto');
const path = require('path');
const dotenv = require('dotenv');
const { uniqueOrigins } = require('../utils/cors-origin-normalize');
const { BRAND } = require('./brand');

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

if (process.env.SUPABASE_URL) {
  let u = String(process.env.SUPABASE_URL).trim();
  u = u.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  process.env.SUPABASE_URL = u;
}

const ENV_MESSAGES = {
  corsWildcardNotAllowed: '[CORS][INFO] CORS_ORIGINS="*" não é permitido.',
  notConfigured: '(não configurado)',
  emailDisabledInfo: `${BRAND.logPrefix}[INFO] Email: BREVO_API_KEY ausente; email desativado (startup continua).`,
  cookieSameSiteNoneSecureInfo: `${BRAND.logPrefix}[INFO] COOKIE_SAMESITE="none" exige COOKIE_SECURE=true.`,
};

function envMessage(key) {
  return ENV_MESSAGES[key] || key;
}

function resolvePublicApiUrl() {
  const raw =
    process.env.PUBLIC_API_URL ||
    process.env.API_URL ||
    process.env.BACKEND_URL ||
    process.env.RENDER_EXTERNAL_URL;
  if (raw) return String(raw).trim().replace(/\/+$/, '');
  if (process.env.NODE_ENV === 'production') return 'https://teglion.onrender.com';
  return 'http://localhost:8001';
}

function resolveGoogleOAuthRedirectUri() {
  if (process.env.GOOGLE_OAUTH_REDIRECT_URI) {
    return String(process.env.GOOGLE_OAUTH_REDIRECT_URI).trim().replace(/\/+$/, '');
  }
  const frontend = String(process.env.FRONTEND_URL || '').trim().replace(/\/+$/, '');
  if (frontend) {
    return `${frontend}/api/auth/google/callback`;
  }
  return `${resolvePublicApiUrl()}/api/auth/google/callback`;
}

function isRenderInternalRedisUrl(url) {
  const host = String(url || '')
    .replace(/^rediss?:\/\//i, '')
    .split('@')
    .pop()
    ?.split(':')[0]
    ?.trim();
  return Boolean(host && /^red-[a-z0-9]+$/i.test(host));
}

function parseCorsOrigins(raw) {
  if (!raw) return [];

  const trimmed = String(raw).trim();
  if (trimmed === '*') {
    console.log(envMessage('corsWildcardNotAllowed'));
    return [];
  }

  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter((s) => Boolean(s) && s !== '*');
}

function normalizeCookieSameSite(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (value === 'none') return 'none';
  if (value === 'strict') return 'strict';
  if (value === 'lax') return 'lax';
  return '';
}

function resolveCookieSameSite() {
  const explicit = normalizeCookieSameSite(process.env.COOKIE_SAMESITE);
  if (explicit) return explicit;
  if (process.env.NODE_ENV === 'production') return 'none';
  return 'lax';
}

function resolveRateLimitWindowMs() {
  const fromMs = Number(process.env.RATE_LIMIT_WINDOW_MS);
  if (!Number.isNaN(fromMs) && fromMs > 0) return fromMs;
  const mins = Number(process.env.RATE_LIMIT_WINDOW_MINUTES || 15);
  return mins * 60 * 1000;
}

function resolveRateLimitMaxRequests() {
  const fromDedicated = Number(process.env.RATE_LIMIT_MAX_REQUESTS);
  if (!Number.isNaN(fromDedicated) && fromDedicated > 0) return fromDedicated;
  const legacy = Number(process.env.RATE_LIMIT_MAX);
  if (!Number.isNaN(legacy) && legacy > 0) return legacy;
  return 300;
}

function resolveRateLimitAuthMax() {
  const fromEnv = Number(process.env.RATE_LIMIT_AUTH_MAX);
  if (!Number.isNaN(fromEnv) && fromEnv > 0) return fromEnv;
  return 1200;
}

function resolveLoginMaxFailures() {
  const n = Number(process.env.LOGIN_MAX_FAILURES);
  if (!Number.isNaN(n) && n > 0) return n;
  return 5;
}

function resolveLoginLockoutMs() {
  const fromMs = Number(process.env.LOGIN_LOCKOUT_MS);
  if (!Number.isNaN(fromMs) && fromMs > 0) return fromMs;
  const mins = Number(process.env.LOGIN_LOCKOUT_MINUTES || 15);
  return mins * 60 * 1000;
}

const { parseDurationMs } = require('../utils/duration-ms');

function resolveLoginAttemptWindowMs() {
  const fromMs = Number(process.env.LOGIN_ATTEMPT_WINDOW_MS);
  if (!Number.isNaN(fromMs) && fromMs > 0) return fromMs;
  return resolveLoginLockoutMs();
}

function resolveAccessTokenMaxAgeMs() {
  const explicit = Number(process.env.ACCESS_TOKEN_MAX_AGE_MS);
  if (!Number.isNaN(explicit) && explicit > 0) return explicit;
  return parseDurationMs(process.env.JWT_ACCESS_EXPIRES_IN || '15m', 15 * 60 * 1000);
}

function resolveMaxFileSizeMb() {
  const contabilMb = Number(process.env.CONTABIL_MAX_FILE_SIZE_MB);
  if (!Number.isNaN(contabilMb) && contabilMb > 0) return contabilMb;
  const mb = Number(process.env.MAX_FILE_SIZE_MB);
  if (!Number.isNaN(mb) && mb > 0) return mb;
  return 25;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 8001),
  PRODUCT_MODE: 'contabil',

  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || 'contabil-documents',

  CORS_ORIGINS: uniqueOrigins(parseCorsOrigins(process.env.CORS_ORIGINS)),

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  ACCESS_TOKEN_MAX_AGE_MS: resolveAccessTokenMaxAgeMs(),

  RATE_LIMIT_WINDOW_MS: resolveRateLimitWindowMs(),
  RATE_LIMIT_MAX: resolveRateLimitMaxRequests(),
  RATE_LIMIT_AUTH_MAX: resolveRateLimitAuthMax(),

  LOGIN_MAX_FAILURES: resolveLoginMaxFailures(),
  LOGIN_LOCKOUT_MS: resolveLoginLockoutMs(),
  LOGIN_ATTEMPT_WINDOW_MS: resolveLoginAttemptWindowMs(),

  MAX_FILE_SIZE: resolveMaxFileSizeMb(),

  REDIS_URL: process.env.REDIS_URL,
  BULLMQ_SKIP_VERSION_CHECK: String(process.env.BULLMQ_SKIP_VERSION_CHECK || '').toLowerCase() === 'true',

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  DATA_ENCRYPTION_KEY: process.env.DATA_ENCRYPTION_KEY,
  DOCUMENTS_SIGNING_SECRET: process.env.DOCUMENTS_SIGNING_SECRET,
  DOCUMENTS_SIGNED_URL_TTL_SECONDS: Number(process.env.DOCUMENTS_SIGNED_URL_TTL_SECONDS || 300),

  COOKIE_SECURE: process.env.COOKIE_SECURE
    ? String(process.env.COOKIE_SECURE).toLowerCase() === 'true'
    : process.env.NODE_ENV === 'production',
  COOKIE_SAMESITE: resolveCookieSameSite(),
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || null,

  ALLOW_BEARER_AUTH: String(process.env.ALLOW_BEARER_AUTH || '').toLowerCase() === 'true',

  SMTP_HOST: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
  FROM_EMAIL: process.env.FROM_EMAIL,
  FROM_NAME: process.env.FROM_NAME,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  BREVO_SMS_SENDER: process.env.BREVO_SMS_SENDER || BRAND.name,
  BLOG_NEWSLETTER_NOTIFY_EMAIL: process.env.BLOG_NEWSLETTER_NOTIFY_EMAIL || null,

  CRON_SECRET: process.env.CRON_SECRET || null,
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || null,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || null,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || null,

  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID || null,
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET || null,
  GOOGLE_OAUTH_REDIRECT_URI: resolveGoogleOAuthRedirectUri(),
  PUBLIC_API_URL: process.env.PUBLIC_API_URL || resolvePublicApiUrl(),

  EMAIL_FROM_SUPPORT: process.env.EMAIL_FROM_SUPPORT || `"${BRAND.name} Suporte" <${BRAND.emails.support}>`,
  EMAIL_FROM_CONTACT: process.env.EMAIL_FROM_CONTACT || `"${BRAND.name}" <${BRAND.emails.hello}>`,
  EMAIL_FROM_COMMERCIAL: process.env.EMAIL_FROM_COMMERCIAL || `"${BRAND.name}" <${BRAND.emails.commercial}>`,
  SMTP_FROM:
    process.env.SMTP_FROM ||
    (process.env.FROM_EMAIL ? `${process.env.FROM_NAME || BRAND.name} <${process.env.FROM_EMAIL}>` : null) ||
    process.env.EMAIL_FROM_CONTACT ||
    `"${BRAND.name}" <${BRAND.emails.hello}>`,

  FRONTEND_URL: String(process.env.FRONTEND_URL || 'http://localhost:3000')
    .trim()
    .replace(/\/+$/, ''),
  EMAIL_ENABLED: Boolean(process.env.BREVO_API_KEY),

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
  STRIPE_PRICE_ID_EUR: process.env.STRIPE_PRICE_ID_EUR,
  STRIPE_PRICE_ID_BRL: process.env.STRIPE_PRICE_ID_BRL,
  STRIPE_PRICE_ID_USD: process.env.STRIPE_PRICE_ID_USD,
  FIRM_PLAN_EUR_CENTS: Number(
    process.env.FIRM_PLAN_EUR_CENTS || 2999,
  ),

  SENTRY_DSN: process.env.SENTRY_DSN || null,

  LEGAL_OPERATOR_NAME: process.env.LEGAL_OPERATOR_NAME || null,
  LEGAL_OPERATOR_NIF: process.env.LEGAL_OPERATOR_NIF || null,
  LEGAL_OPERATOR_EMAIL: process.env.LEGAL_OPERATOR_EMAIL || null,
  LEGAL_OPERATOR_PHONE: process.env.LEGAL_OPERATOR_PHONE || null,
  LEGAL_OPERATOR_LOCATION: process.env.LEGAL_OPERATOR_LOCATION || null,
  LEGAL_OPERATOR_CAE: process.env.LEGAL_OPERATOR_CAE || null,

  SMS_ENABLED: Boolean(process.env.SMS_ENABLED),

  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  isVercelDomain(domain) {
    if (!domain) return false;
    const vercelDomains = [
      'vercel.app',
      '.vercel.app',
      'jaelson-silva-dos-santos-projects.vercel.app',
    ];
    return vercelDomains.some((vercelDomain) => domain.includes(vercelDomain));
  },

  getFrontendUrlForEmail(req) {
    if (this.isProduction) {
      return this.FRONTEND_URL;
    }

    if (req && req.headers && req.headers.referer) {
      try {
        const refererUrl = new URL(req.headers.referer);
        const refererDomain = refererUrl.origin;
        if (this.isVercelDomain(refererDomain)) {
          console.log(`📧 Email (DEV): Usando domínio do referer: ${refererDomain}`);
          return refererDomain;
        }
      } catch (e) {
        console.log(`📧 Email (DEV): Erro ao parse referer: ${e.message}`);
      }
    }

    return this.FRONTEND_URL;
  },
};

const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

if (env.isProduction) {
  required.push('DATA_ENCRYPTION_KEY', 'DOCUMENTS_SIGNING_SECRET', 'FROM_EMAIL', 'FRONTEND_URL');
}

let missing = required.filter((k) => !env[k]);
if (env.isProduction && !process.env.CORS_ORIGINS?.trim()) {
  missing.push('CORS_ORIGINS');
}
if (missing.length > 0) {
  console.error(`${BRAND.logPrefix} Variáveis de ambiente em falta: ${missing.join(', ')}`);
  console.error(`${BRAND.logPrefix} Verifique .env / .env.local ou variáveis no Render`);
  throw new Error(`${BRAND.logPrefix} Variáveis de ambiente em falta: ${missing.join(', ')}`);
}

if (env.DATA_ENCRYPTION_KEY) {
  const keyFingerprint = crypto.createHash('sha256').update(env.DATA_ENCRYPTION_KEY).digest('hex').slice(0, 12);
  console.log(`🔐 DATA_ENCRYPTION_KEY fingerprint: ${keyFingerprint} (len=${env.DATA_ENCRYPTION_KEY.length})`);
}

console.log(`📧 Configuração de Email:`);
if (env.BREVO_API_KEY) {
  console.log(`   Transportador: Brevo API (REST)`);
  console.log(`   Endpoint: https://api.brevo.com/v3/smtp/email`);
} else {
  console.log(`   Transportador: ❌ Não configurado (BREVO_API_KEY ausente)`);
}
console.log(`   From (support): ${env.EMAIL_FROM_SUPPORT || envMessage('notConfigured')}`);
console.log(`   From (contact): ${env.EMAIL_FROM_CONTACT || envMessage('notConfigured')}`);
console.log(`   From (commercial): ${env.EMAIL_FROM_COMMERCIAL || envMessage('notConfigured')}`);
console.log(`   Frontend URL: ${env.FRONTEND_URL}`);
console.log(`   NODE_ENV: ${env.NODE_ENV}`);
console.log(`   PRODUCT_MODE: ${env.PRODUCT_MODE}`);
console.log(`   Rate limit: windowMs=${env.RATE_LIMIT_WINDOW_MS}, maxAnonymous=${env.RATE_LIMIT_MAX}, maxAuth=${env.RATE_LIMIT_AUTH_MAX}`);
if (!env.EMAIL_ENABLED) {
  console.log(envMessage('emailDisabledInfo'));
}

if (env.isDevelopment && env.REDIS_URL && isRenderInternalRedisUrl(env.REDIS_URL)) {
  console.log(
    `${BRAND.logPrefix}[WARN] REDIS_URL parece ser URL interna Render — não funciona no Mac. ` +
    'Use External URL (rediss://) ou remova REDIS_URL em dev local.',
  );
}

if (env.COOKIE_SAMESITE === 'none' && !env.COOKIE_SECURE) {
  console.log(envMessage('cookieSameSiteNoneSecureInfo'));
  env.COOKIE_SECURE = true;
}

console.log(
  `${BRAND.logPrefix} Auth cookies: SameSite=${env.COOKIE_SAMESITE}, Secure=${env.COOKIE_SECURE}, domain=${env.COOKIE_DOMAIN || '(host-only)'}`,
);

module.exports = { env };
