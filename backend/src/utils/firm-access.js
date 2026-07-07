const { AppError } = require('../middlewares/error.middleware');
const { computeFirmAccess } = require('../modules/billing/billing.service');

const FIRM_ACCESS_MESSAGES = {
  TRIAL_EXPIRED:
    'O período de teste terminou. Active o plano ou contacte o suporte TegLion para continuar.',
  CANCELLED: 'Esta conta de escritório foi encerrada. Contacte o suporte TegLion se precisar de reactivação.',
  SUSPENDED: 'Acesso suspenso. Regularize o pagamento ou contacte o suporte TegLion.',
  BLOCKED: 'Acesso bloqueado. Contacte o suporte TegLion.',
  NOT_FOUND: 'Escritório não encontrado.',
};

function firmAccessDeniedMessage(reason) {
  return FIRM_ACCESS_MESSAGES[reason] || FIRM_ACCESS_MESSAGES.BLOCKED;
}

/** Bloqueia login/refresh quando o escritório não tem acesso activo (excepto trial expirado → billing). */
function assertFirmLoginAllowed(firm) {
  if (!firm) {
    throw new AppError(FIRM_ACCESS_MESSAGES.NOT_FOUND, 404, { code: 'FIRM_NOT_FOUND' });
  }
  const access = computeFirmAccess(firm);
  if (access.hasAccess) return access;
  if (access.reason === 'TRIAL_EXPIRED') return access;
  const code = access.reason === 'CANCELLED' ? 'FIRM_CANCELLED' : access.reason;
  throw new AppError(firmAccessDeniedMessage(access.reason), 403, { code });
}

module.exports = {
  FIRM_ACCESS_MESSAGES,
  firmAccessDeniedMessage,
  assertFirmLoginAllowed,
};
