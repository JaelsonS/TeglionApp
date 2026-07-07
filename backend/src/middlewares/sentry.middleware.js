const { Sentry } = require('../instrument');
const { env } = require('../config/env');

function sentryMiddleware(req, res, next) {
  if (!Sentry) {
    return next();
  }

  if (typeof Sentry.getCurrentHub !== 'function') {
    return next();
  }
  const hub = Sentry.getCurrentHub();
  hub.pushScope();
  const scope = hub.getScope();

  if (scope) {
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
      if (req.user.firmId) {
        scope.setTag('firm_id', req.user.firmId);
      }
      if (req.user.clientId) {
        scope.setTag('client_id', req.user.clientId);
      }
    }
  }

  const cleanup = () => {
    try {
      hub.popScope();
    } catch {
      // ignore
    }
  };

  res.once('finish', cleanup);
  res.once('close', cleanup);

  return next();
}

module.exports = { sentryMiddleware }
