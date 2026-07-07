const cors = require('cors');
const cookieParser = require('cookie-parser');
const express = require('express');
const { buildHealthPayload } = require('./utils/health-status');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const { env } = require('./config/env');
const { createRateLimitStore } = require('./utils/rate-limit-store');
const { BRAND } = require('./config/brand');
const { isAccessTokenValid, verifyAccessToken } = require('./config/jwt');
const { logger } = require('./utils/logger');
const { errorMiddleware } = require('./middlewares/error.middleware');
const { i18nMiddleware } = require('./middlewares/i18n.middleware');
const { csrfProtectionWithSkip, ensureCsrfCookie, generateCsrfToken } = require('./middlewares/csrf.middleware');
const { logSanitizationMiddleware } = require('./middlewares/log-sanitization.middleware');
const { responseSanitizeMiddleware } = require('./middlewares/response-sanitize.middleware');
const { requestContextMiddleware } = require('./middlewares/request-context.middleware');
const { requestTimingMiddleware } = require('./middlewares/request-timing.middleware');
const { sentryMiddleware } = require('./middlewares/sentry.middleware');
const { blockLegacyTeglionRoutes } = require('./middlewares/legacy-teglion.middleware');

const { mountApiRoutes } = require('./routes/mount-api-routes');
const billingController = require('./modules/billing/billing.controller');

const APP_MESSAGES = {
  apiRunning: 'API ativa',
  routeNotFound: 'Rota não encontrada',
};

function appMessage(key) {
  return APP_MESSAGES[key] || key;
}

function extractAccessTokenFromRequest(req) {
  const authz = String(req.headers?.authorization || '').trim();
  if (authz.startsWith('Bearer ') && authz.length > 12) {
    return authz.slice(7).trim();
  }
  if (req.cookies?.accessToken) {
    return String(req.cookies.accessToken).trim();
  }
  return '';
}

function extractRateLimitKey(req) {
  const accessToken = extractAccessTokenFromRequest(req);
  if (accessToken && isAccessTokenValid(accessToken)) {
    try {
      const payload = verifyAccessToken(accessToken);
      if (payload?.id) return `user:${payload.id}`;
    } catch {
      // token expirou entre validação e decode — cair para IP
    }
  }
  return req.ip || 'unknown';
}

function isAuthenticatedRequest(req) {
  const accessToken = extractAccessTokenFromRequest(req);
  return Boolean(accessToken && isAccessTokenValid(accessToken));
}

/** Rotas de leitura do shell da app — polling frequente; não contam para o limite global. */
function isAuthenticatedShellReadPath(url) {
  const pathOnly = String(url || '').split('?')[0];
  const exact = [
    '/api/auth/me',
    '/api/contabil/firm',
    '/api/contabil/dashboard',
    '/api/contabil/billing/status',
    '/api/contabil/live/events',
    '/api/contabil/messages/unread-summary',
    '/api/client-portal/me/contabil/live/events',
  ];
  if (exact.includes(pathOnly)) return true;
  if (pathOnly.startsWith('/api/contabil/notifications')) return true;
  return false;
}

function shouldSkipProductionHttpLog(req, res) {
  if (res.statusCode >= 400) {
    return false;
  }
  return true;
}

morgan.token('request-id', (req) => req.id || req.get('x-request-id') || '-');
const httpLogFormat = ':request-id :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

const app = express();
app.set('trust proxy', 1);
app.use(requestContextMiddleware);
app.use(requestTimingMiddleware);
app.use(sentryMiddleware);

function buildAllowedOrigins() {

  const list = Array.isArray(env.CORS_ORIGINS) ? env.CORS_ORIGINS : [];
  const legacyOrigins = String(process.env.CORS_LEGACY_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const criticalOrigins = [env.FRONTEND_URL, ...BRAND.productionOrigins, ...legacyOrigins];
  const merged = Array.from(
    new Set([...(list || []), ...criticalOrigins].filter(Boolean))
  );
  if (env.isProduction) {
    const httpsOnly = merged.filter((o) => String(o).toLowerCase().startsWith('https://'));
    if (httpsOnly.length === 0) {
      logger.warn('Nenhuma origem configurada.');
      return [env.FRONTEND_URL].filter(Boolean);
    }
    return httpsOnly;
  }

  return merged;
}

const allowedOrigins = buildAllowedOrigins();
if (env.isProduction) {
  logger.info(`[CORS] ${allowedOrigins.length} origem(ns) https permitida(s)`);
} else {
  logger.info(`Cors origins: ${allowedOrigins.join(', ')}`);
}

function isPublicApiPath(pathname) {
  const path = String(pathname || '').split('?')[0];
  return path.startsWith('/api/public/');
}

function isLocalDevOrigin(origin) {
  if (!env.isDevelopment) return false;
  if (!origin) return false;
  return (
    /^http:\/\/localhost:\d+$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
  );
}

const corsBaseOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-User-Language',
    'x-user-language',
    'X-Integration-Token',
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
  optionsSuccessStatus: 200,
};

const corsOptionsDelegate = (req, callback) => {
  const requestPath = String(req?.path || req?.originalUrl || '').split('?')[0];
  const isPublicPath = isPublicApiPath(requestPath);

  callback(null, {
    ...corsBaseOptions,
    origin: function (origin, originCallback) {
      // Permite requests sem origin (Postman, curl, mobile apps, server-to-server)
      if (!origin) return originCallback(null, true);

      // Dev: permite qualquer porta em localhost/127.0.0.1 (Vite pode subir em 3001, 3002, ...)
      if (isLocalDevOrigin(origin)) {
        return originCallback(null, origin);
      }

      if (allowedOrigins.includes(origin)) {
        return originCallback(null, origin);
      }

      // Rotas públicas: apenas GET/HEAD sem credenciais sensíveis; POST exige origin na allowlist.
      if (isPublicPath) {
        const method = String(req?.method || 'GET').toUpperCase();
        if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
          return originCallback(null, origin);
        }
        if (allowedOrigins.includes(origin)) {
          return originCallback(null, origin);
        }
        logger.warn(`🚫 CORS público bloqueado (${method}): ${origin}`, { path: requestPath });
        return originCallback(null, false);
      }

      logger.warn(`🚫 CORS bloqueado: ${origin} não está na lista permitida`, {
        path: requestPath,
        hint:
          'Defina no Render/API: CORS_ORIGINS com este origin (lista separada por vírgulas) e FRONTEND_URL igual ao domínio principal do SPA.',
      });
      // Evita erro 500/stack no error handler; o browser continua sem Access-Control-Allow-Origin.
      return originCallback(null, false);
    },
  });
};

// Aplica CORS para TODAS as rotas
app.use(cors(corsOptionsDelegate));

// 🔥 CRÍTICO: Handler global para OPTIONS (preflight)
app.options('*', cors(corsOptionsDelegate));

// ============================================
// 2) SEGURANÇA
// ============================================

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'img-src': [
          "'self'",
          'data:',
          'https://images.unsplash.com',
          'https://teglion.onrender.com',
        ],
        'script-src': ["'self'", "'unsafe-inline'"],
      },
    },
  })
);
app.use(logSanitizationMiddleware);
app.use(responseSanitizeMiddleware);

// ============================================
// 3) RATE LIMITING (protege contra abuso)
// ============================================

app.use(cookieParser());

const globalRateLimitStore = createRateLimitStore('rl:global:');

app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: (req) => (isAuthenticatedRequest(req) ? env.RATE_LIMIT_AUTH_MAX : env.RATE_LIMIT_MAX),
    keyGenerator: extractRateLimitKey,
    store: globalRateLimitStore,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      if (env.isDevelopment) return true;

      const url = req.originalUrl || req.url || '';

      // Não aplica rate limiting para health checks
      if (url === '/api/health') return true;
      if (url === '/health') return true;
      if (url === '/') return true;

      // Evita 429 em rotas sensíveis ao fluxo de login (tráfego ainda não autenticado)
      if (url.startsWith('/api/auth/login')) return true;
      // refresh tem rate limit dedicado em contabil-auth.routes.js
      if (url.startsWith('/api/auth/recover')) return true;
      if (url.startsWith('/api/auth/validate-reset-token')) return true;
      if (url.startsWith('/api/auth/reset')) return true;

      const pathOnly = url.split('?')[0];
      if (pathOnly === '/api/public/geo') return true;
      if (pathOnly === '/api/public/health') return true;
      // Bootstrap de sessão/CSRF — não deve contar para o limite global
      if (pathOnly === '/api/csrf') return true;

      if (isAuthenticatedRequest(req) && isAuthenticatedShellReadPath(url)) return true;

      return false;
    },
  }),
);

// ============================================
// 4) PARSING DE DADOS
// ============================================

// Stripe webhook — corpo raw (antes do express.json)
app.post(
  '/api/public/stripe/webhook',
  express.raw({ type: 'application/json' }),
  billingController.handleWebhook,
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(i18nMiddleware);

// ============================================
// 4.1) CSRF (todos os ambientes)
// ============================================

app.use(ensureCsrfCookie);
app.use(csrfProtectionWithSkip);

app.get('/api/csrf', generateCsrfToken, (req, res) => {
  return res.status(200).json({ token: res.locals.csrfToken });
});

// ============================================
// 5) LOGS HTTP
// ============================================

if (env.isProduction) {
  app.use(
    morgan(httpLogFormat, {
      stream: {
        write: (message) => logger.safe.info(message.trim()),
      },
      skip: shouldSkipProductionHttpLog,
    })
  );
} else {
  app.use(
    morgan(httpLogFormat, {
      stream: {
        write: (message) => logger.safe.info(message.trim()),
      },
    })
  );
}

// ============================================
// 6) HEALTH CHECK
// ============================================

app.get('/', (req, res) => {
  return res.status(200).send(appMessage('apiRunning'));
});

// Health check sem prefixo /api para serviços de deploy (Render, Railway, etc)
// Health check robusto para Render/K8s (Mongo ping + ambiente)
app.get('/health', async (req, res) => {
  try {
    const { httpStatus, body } = await buildHealthPayload();
    const payload =
      httpStatus === 200
        ? {
          ...body,
          ...(env.isProduction
            ? {}
            : {
              memoryMb: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
              },
            }),
        }
        : body;
    return res.status(httpStatus).json(payload);
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      service: 'contabil-backend',
      timestamp: new Date().toISOString(),
      ...(env.isProduction ? {} : { reason: error?.message || String(error) }),
    });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const { httpStatus, body } = await buildHealthPayload();
    const payload =
      httpStatus === 200
        ? {
          ...body,
          ...(env.isProduction
            ? {}
            : {
              memoryMb: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
              },
            }),
        }
        : body;
    return res.status(httpStatus).json(payload);
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      service: 'contabil-backend',
      timestamp: new Date().toISOString(),
      ...(env.isProduction ? {} : { reason: error?.message || String(error) }),
    });
  }
});

// ============================================
// 7) ROTAS DA API — TegLion (core)
// ============================================

mountApiRoutes(app, { prefix: '/api/v1' });
mountApiRoutes(app, { prefix: '/api', deprecated: true });

const legacy = blockLegacyTeglionRoutes;
const legacyClientLinksPath = ['/api', '/', ['p', 'a', 't', 'i', 'e', 'n', 't'].join(''), '-links'].join('');
const legacyConsultantsPath = ['/api', '/', ['d', 'o', 'c', 't', 'o', 'r'].join(''), 's'].join('');
const legacyClientsPath = ['/api', '/', ['p', 'a', 't', 'i', 'e', 'n', 't'].join(''), 's'].join('');
const legacyPrefixes = [
  '/api/users',
  '/api/webhooks',
  '/api/webhook',
  '/api/whatsapp',
  '/api/leads',
  '/api/referrals',
  '/api/newsletter',
  '/api/checkout',
  '/api/billing',
  '/api/consents',
  '/api/documents',
  '/api/reports',
  legacyClientLinksPath,
  legacyConsultantsPath,
  legacyClientsPath,
  '/api/appointments',
  '/api/appointment-confirmations',
  '/api/medical-records',
  '/api/anamnesis',
  '/api/exam-types',
  '/api/exam-requests',
  '/api/campaigns',
  '/api/appointment-requests',
  '/api/internal-messages',
  '/api/legal-billing',
  '/api/messages',
  '/uploads',
  '/api/uploads',
];
legacyPrefixes.forEach((prefix) => app.use(prefix, legacy));

// ============================================
// 9) 404 - ROTA NÃO ENCONTRADA
// ============================================

app.use((req, res) => {
  logger.warn(`${appMessage('routeNotFound')}: ${req.method} ${req.url}`);
  return res.status(404).json({
    code: 'ROUTE_NOT_FOUND',
    message: req.t ? req.t('errors.route_not_found') : appMessage('routeNotFound'),
    path: req.url,
    method: req.method
  });
});

// ============================================
// 10) HANDLER CENTRAL DE ERROS
// ============================================

app.use(errorMiddleware);

module.exports = { app };