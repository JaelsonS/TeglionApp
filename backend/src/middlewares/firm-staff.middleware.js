const { AppError } = require('./error.middleware');

/**
 * Restricts /api/contabil firm APIs to firm actors (not portal CLIENT).
 * Clients use /api/client-portal only.
 */
function requireFirmStaff(req, res, next) {
  if (!req.user?.id) {
    return next(new AppError('Não autenticado', 401, { code: 'UNAUTHENTICATED' }));
  }
  if (String(req.user.role || '').toUpperCase() === 'CLIENT') {
    return next(new AppError('Acesso negado', 403, { code: 'FIRM_STAFF_REQUIRED' }));
  }
  return next();
}

module.exports = { requireFirmStaff };
