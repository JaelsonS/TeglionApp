/**
 * Estado das integrações opcionais (staging/produção) — sem expor segredos.
 */
const Redis = require('ioredis');
const { env } = require('../config/env');
const { isGoogleSsoEnabled } = require('../modules/auth/google/google-sso.service');
const { isStripeConfigured } = require('../services/stripe/stripe-client');
const pushService = require('../modules/push/push.service');
const { isSupabaseConfigured } = require('../db/supabase/client');

const REDIS_PROBE_MS = 4000;

function maskConfigured(value) {
  return Boolean(String(value || '').trim());
}

function maskRedirectUri(uri) {
  const value = String(uri || '').trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return value.split('?')[0] || null;
  }
}

async function probeRedis() {
  const url = String(env.REDIS_URL || '').trim();
  if (!url) {
    return { configured: false, status: 'disabled', message: 'REDIS_URL ausente — rate limit in-memory' };
  }

  let client;
  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: REDIS_PROBE_MS,
      commandTimeout: REDIS_PROBE_MS,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
      tls: {},
      family: 4,
    });
    client.on('error', () => {});
    await client.connect();
    const pong = await client.ping();
    return {
      configured: true,
      status: pong === 'PONG' ? 'connected' : 'degraded',
      message: pong === 'PONG' ? 'Redis respondeu PONG' : `Resposta inesperada: ${pong}`,
    };
  } catch (err) {
    return {
      configured: true,
      status: 'error',
      message: err?.message || String(err),
    };
  } finally {
    if (client) await client.quit().catch(() => {});
  }
}

function probeGoogleSso() {
  const configured = isGoogleSsoEnabled();
  const redirectUri = String(env.GOOGLE_OAUTH_REDIRECT_URI || '').trim();
  const redirectHost = (() => {
    try {
      return redirectUri ? new URL(redirectUri).hostname : null;
    } catch {
      return null;
    }
  })();
  const frontendHost = (() => {
    try {
      return env.FRONTEND_URL ? new URL(env.FRONTEND_URL).hostname : null;
    } catch {
      return null;
    }
  })();
  const sameOriginCallback =
    !redirectHost || !frontendHost || redirectHost === frontendHost;
  return {
    configured,
    status:
      configured && redirectUri && sameOriginCallback
        ? 'ready'
        : configured && redirectUri
          ? 'misconfigured'
          : configured
            ? 'misconfigured'
            : 'disabled',
    redirectUriSet: maskConfigured(redirectUri),
    redirectHost,
    frontendHost,
    sameOriginCallback,
    message: configured
      ? redirectUri
        ? sameOriginCallback
          ? `OAuth activo — callback em ${maskRedirectUri(redirectUri)}`
          : `Callback OAuth (${redirectHost}) diferente do frontend (${frontendHost}) — cookies podem falhar no mobile`
        : 'GOOGLE_OAUTH_REDIRECT_URI em falta'
      : 'Defina GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET e GOOGLE_OAUTH_REDIRECT_URI',
  };
}

function probeWebPush() {
  const hasPublic = maskConfigured(env.VAPID_PUBLIC_KEY);
  const hasPrivate = maskConfigured(env.VAPID_PRIVATE_KEY);
  const configured = hasPublic && hasPrivate;
  const publicKey = pushService.getVapidPublicKey();
  return {
    configured,
    status: configured && publicKey ? 'ready' : configured ? 'misconfigured' : 'disabled',
    publicKeySet: hasPublic,
    privateKeySet: hasPrivate,
    publicKeyLength: publicKey ? String(publicKey).length : 0,
    message: configured
      ? publicKey
        ? 'VAPID keys definidas — Web Push activo'
        : 'VAPID keys inválidas'
      : 'Defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no Render',
  };
}

function probeSupabaseStorage() {
  const configured = isSupabaseConfigured();
  const bucket = env.SUPABASE_STORAGE_BUCKET || 'contabil-documents';
  return {
    configured,
    status: configured ? 'ready' : 'disabled',
    bucket,
    message: configured
      ? `Supabase Storage activo (bucket=${bucket})`
      : 'Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY',
  };
}

function probeStripe() {
  const hasSecret = maskConfigured(env.STRIPE_SECRET_KEY);
  const hasWebhook = maskConfigured(env.STRIPE_WEBHOOK_SECRET);
  const hasPrice = maskConfigured(env.STRIPE_PRICE_ID_EUR || env.STRIPE_PRICE_ID);
  const configured = isStripeConfigured();
  let status = 'disabled';
  if (configured && hasWebhook && hasPrice) status = 'ready';
  else if (configured) status = 'partial';
  else if (hasSecret) status = 'misconfigured';

  return {
    configured: hasSecret,
    status,
    webhookSecretSet: hasWebhook,
    priceIdSet: hasPrice,
    checkoutReady: configured && hasPrice,
    message: status === 'ready'
      ? 'Stripe checkout + webhook configurados'
      : status === 'partial'
        ? 'STRIPE_SECRET_KEY OK — falta WEBHOOK_SECRET ou PRICE_ID'
        : 'Defina STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET e STRIPE_PRICE_ID_EUR',
  };
}

function probeBrevoEmail() {
  const configured = maskConfigured(env.BREVO_API_KEY);
  const fromSet = maskConfigured(env.FROM_EMAIL);
  let status = 'disabled';
  if (configured && fromSet) status = 'ready';
  else if (configured) status = 'partial';

  return {
    configured,
    status,
    fromEmailSet: fromSet,
    emailEnabled: env.EMAIL_ENABLED === true,
    message:
      status === 'ready'
        ? 'Brevo API activo (e-mails transaccionais)'
        : status === 'partial'
          ? 'BREVO_API_KEY OK — falta FROM_EMAIL'
          : 'Defina BREVO_API_KEY e FROM_EMAIL no Render',
  };
}

async function buildIntegrationsHealthPayload() {
  const [redis] = await Promise.all([probeRedis()]);
  const googleSso = probeGoogleSso();
  const webPush = probeWebPush();
  const supabaseStorage = probeSupabaseStorage();
  const stripe = probeStripe();
  const email = probeBrevoEmail();

  const optionalChecks = [redis, googleSso, webPush, supabaseStorage, stripe, email].filter((item) => item.configured);
  const allOptionalReady =
    optionalChecks.length === 0 ||
    optionalChecks.every((item) => ['connected', 'ready'].includes(item.status));

  return {
    ok: allOptionalReady,
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV || 'development',
    publicApiUrl: env.PUBLIC_API_URL || null,
    integrations: {
      redis,
      googleSso,
      webPush,
      supabaseStorage,
      stripe,
      email,
    },
  };
}

module.exports = {
  buildIntegrationsHealthPayload,
  probeRedis,
  probeGoogleSso,
  probeWebPush,
  probeSupabaseStorage,
  probeStripe,
  probeBrevoEmail,
};
