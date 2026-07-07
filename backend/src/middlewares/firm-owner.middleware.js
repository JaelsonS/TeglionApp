const { AppError } = require('./error.middleware');
const firmUsersRepository = require('../db/supabase/repositories/firm-users.repository');

/**
 * Exige utilizador autenticado do escritório com papel FIRM_OWNER (dono).
 */
async function requireFirmOwner(req, res, next) {
  try {
    if (!req.user?.id) {
      return next(new AppError('Não autenticado', 401));
    }
    if (req.user.role === 'CLIENT') {
      return next(new AppError('Acesso negado', 403));
    }
    const row = await firmUsersRepository.findFirmUserById(String(req.user.id));
    const firmId = String(req.user.firmId || '');
    if (!row || String(row.firm_id) !== firmId) {
      return next(new AppError('Utilizador do escritório não encontrado', 403));
    }
    if (row.role !== 'FIRM_OWNER' || row.is_active === false) {
      return next(
        new AppError('Apenas o responsável (dono) do escritório pode executar esta ação.', 403, {
          code: 'FIRM_OWNER_REQUIRED',
        }),
      );
    }
    req.firmUserRecord = row;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { requireFirmOwner };
