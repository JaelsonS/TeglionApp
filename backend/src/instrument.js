const { env } = require('./config/env');

let Sentry = null;

if (env.SENTRY_DSN) {
  try {
    const s = require('@sentry/node');
    Sentry = s && s.default ? s.default : s;

    Sentry.init({
      dsn: env.SENTRY_DSN,
      release: process.env.SENTRY_RELEASE || process.env.npm_package_version || 'unknown',
      environment: env.NODE_ENV || 'development',
      tracesSampleRate: env.isProduction ? 0.1 : 0,
      sendDefaultPii: false,
      beforeSend(event) {
        if (event.request?.url) {
          event.request.url = String(event.request.url).split('?')[0];
        }
        if (event.request?.headers) {
          const cleaned = { ...event.request.headers };
          delete cleaned.Authorization;
          delete cleaned.authorization;
          delete cleaned.Cookie;
          delete cleaned.cookie;
          event.request.headers = cleaned;
        }
        return event;
      },
    });
  } catch (err) {
    console.warn('Erro ao inicializar Sentry:', err.message);
    Sentry = null;
  }
}

module.exports = { Sentry };
