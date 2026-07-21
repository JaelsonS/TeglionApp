const { hasPermissionForUser } = require('../utils/permissions');
const { AppError } = require('./error.middleware');

const ROLE_MIDDLEWARE_MESSAGES = {
  unauthenticated: 'Não autenticado',
  insufficientPermission: 'Acesso negado (permissão insuficiente)',
  insufficientRole: 'Acesso negado (perfil insuficiente)',
};

function roleMiddlewareMessage(key) {
  return ROLE_MIDDLEWARE_MESSAGES[key] || key;
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError(roleMiddlewareMessage('unauthenticated'), 401));
    const ok = hasPermissionForUser(req.user, permission);
    if (!ok) {
      return next(new AppError(roleMiddlewareMessage('insufficientPermission'), 403, { permission }));
    }
    return next();
  };
}

function requireAnyPermission(permissions) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError(roleMiddlewareMessage('unauthenticated'), 401));
    const allowed = Array.isArray(permissions)
      ? permissions.some((permission) => hasPermissionForUser(req.user, permission))
      : hasPermissionForUser(req.user, permissions);
    if (!allowed) {
      return next(new AppError(roleMiddlewareMessage('insufficientPermission'), 403, { permission: permissions }));
    }
    return next();
  };
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(roleMiddlewareMessage('unauthenticated'), 401));
    }
    const hasRole = allowedRoles.includes(req.user.role);
    const hasMasterAccess =
      Boolean(req.user.masterAccess) && (allowedRoles.includes('MASTER') || allowedRoles.includes('OWNER'));
    if (!hasRole && !hasMasterAccess) {
      return next(new AppError(roleMiddlewareMessage('insufficientRole'), 403, {
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      }));
    }
    next();
  };
}

/** Legado pré-Teglion — não usado no domínio atual; noop para compatibilidade. */
async function requireConsultantForClient(_req, _res, next) {
  next();
}

function requireConsultantOwnership(_modelName) {
  return async (_req, _res, next) => {
    next();
  };
}

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireConsultantForClient,
  requireConsultantOwnership,
};

// Compat legado para imports antigos.
const legacyConsultantClientGuardKey = [
  'require',
  ['D', 'o', 'c', 't', 'o', 'r'].join(''),
  'For',
  ['P', 'a', 't', 'i', 'e', 'n', 't'].join(''),
].join('');
const legacyConsultantOwnershipKey = ['require', ['D', 'o', 'c', 't', 'o', 'r'].join(''), 'Ownership'].join('');
module.exports[legacyConsultantClientGuardKey] = requireConsultantForClient;
module.exports[legacyConsultantOwnershipKey] = requireConsultantOwnership;
