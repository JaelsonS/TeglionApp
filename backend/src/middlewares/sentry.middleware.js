const { Sentry } = require('../instrument');
const { env } = require('../config/env');

/**
 * Anexa contexto de request ao Sentry (SDK v8+/v10 — sem getCurrentHub).
 * Se Sentry não estiver configurado, passa adiante sem efeito.
 */
function sentryMiddleware(req, res, next) {
  if (!Sentry || typeof Sentry.getIsolationScope !== 'function') {
    return next();
  }

  try {
    const scope = Sentry.getIsolationScope();
    scope.setTag('service', 'contabil-backend');
    scope.setTag('product', env.PRODUCT_MODE);
    scope.setTag('environment', env.NODE_ENV || 'development');
    scope.setTag('request_id', req.id || 'unknown');
    scope.setTag('request_method', req.method || 'unknown');
    scope.setTag('request_path', req.originalUrl || req.url || 'unknown');

    if (req.user) {
      scope.setUser({
        id: req.user.id,
        role: req.user.role,
        firmId: req.user.firmId || undefined,
        clientId: req.user.clientId || undefined,
      });
      scope.setTag('user_role', req.user.role);
      if (req.user.firmId) scope.setTag('firm_id', req.user.firmId);
      if (req.user.clientId) scope.setTag('client_id', req.user.clientId);
    }
  } catch {
    // Nunca bloquear o pedido por falha de telemetria
  }

  return next();
}

module.exports = { sentryMiddleware };
