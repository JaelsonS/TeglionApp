/**
 * Acesso ao escritório (tenant) — Supabase firms.
 */
const { AppError } = require('./error.middleware');
const firmsRepository = require('../db/supabase/repositories/firms.repository');
const { readSessionFirmId } = require('../utils/contabil-scope');

const FIRM_ACCESS_MESSAGES = {
  notAuthenticated: 'Não autenticado',
  firmNotFound: 'Escritório não encontrado',
  firmBlockedByStatus:
    'Acesso bloqueado. A subscrição está suspensa ou inactiva. Regularize o pagamento em Plano e subscrição.',
  trialValidationError: 'Erro ao validar o período de teste. Contacte o suporte TegLion.',
  trialExpired:
    'O período de teste terminou. Active o plano em Plano e subscrição para continuar a usar o TegLion.',
};

function firmAccessMessage(key) {
  return FIRM_ACCESS_MESSAGES[key] || key;
}

async function requireActiveFirm(req, res, next) {
  try {
    if (!req.user) {
      return next(new AppError(firmAccessMessage('notAuthenticated'), 401));
    }

    const firmId = readSessionFirmId(req);
    if (!firmId) {
      return next();
    }

    const firm = await firmsRepository.findFirmById(firmId);
    if (!firm) {
      return next(new AppError(firmAccessMessage('firmNotFound'), 404));
    }
    if (firm.status === 'CANCELLED') {
      return next(
        new AppError('Esta conta de escritório foi encerrada. Contacte o suporte TegLion se precisar de reactivação.', 403, {
          code: 'FIRM_CANCELLED',
        }),
      );
    }
    if (firm.status !== 'TRIAL' && firm.status !== 'ACTIVE') {
      return next(new AppError(firmAccessMessage('firmBlockedByStatus'), 403, { code: 'FIRM_BLOCKED' }));
    }
    if (firm.status === 'TRIAL' && firm.trialEndsAt) {
      const trialEndsAt = new Date(firm.trialEndsAt);
      if (!Number.isNaN(trialEndsAt.getTime()) && trialEndsAt.getTime() <= Date.now()) {
        return next(new AppError(firmAccessMessage('trialExpired'), 403, { code: 'TRIAL_EXPIRED' }));
      }
    }
    req.firm = { _id: firm.id, name: firm.name, status: firm.status, billing: { trialEndsAt: firm.trialEndsAt } };
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { requireActiveFirm };
