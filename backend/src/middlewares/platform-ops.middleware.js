/**
 * Teglion Control Center — autorização de plataforma (AfDigital).
 * Requer: PLATFORM_OPS_ENABLED + sessão firm + email na allowlist + MFA activa.
 */
const { AppError } = require('./error.middleware');
const { env } = require('../config/env');
const firmUsersRepository = require('../db/supabase/repositories/firm-users.repository');
const { clientIp } = require('../utils/client-ip');
const auditRepository = require('../db/supabase/repositories/contabil/audit.repository');

function isPlatformOpsEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return false;
  return env.PLATFORM_OPS_EMAIL_ALLOWLIST.includes(normalized);
}

async function requirePlatformOps(req, res, next) {
  try {
    if (!env.PLATFORM_OPS_ENABLED) {
      throw new AppError('Control Center desactivado neste ambiente', 403, {
        code: 'PLATFORM_OPS_DISABLED',
      });
    }
    // Exactamente 1 email — sem equipa alargada nesta fase.
    if (env.PLATFORM_OPS_EMAIL_ALLOWLIST.length !== 1) {
      throw new AppError(
        env.PLATFORM_OPS_EMAIL_ALLOWLIST.length === 0
          ? 'Allowlist de operadores não configurada'
          : 'Control Center exige exactamente 1 email na allowlist',
        503,
        {
          code:
            env.PLATFORM_OPS_EMAIL_ALLOWLIST.length === 0
              ? 'PLATFORM_OPS_ALLOWLIST_EMPTY'
              : 'PLATFORM_OPS_ALLOWLIST_INVALID',
        },
      );
    }

    const userId = req.user?.id || req.user?.userId;
    const role = String(req.user?.role || '').toUpperCase();
    if (!userId) {
      throw new AppError('Não autenticado', 401, { code: 'UNAUTHORIZED' });
    }
    // Só bloquear papel CLIENT. NÃO usar req.user.clientId — readActorClientId
    // fazia fallback para actor.id e marcava firm users como "clientes".
    if (role === 'CLIENT') {
      throw new AppError('Acesso negado', 403, { code: 'PLATFORM_OPS_FORBIDDEN' });
    }

    // findFirmUserById devolve linha crua (snake_case); tolerar camelCase por segurança.
    const firmUser = await firmUsersRepository.findFirmUserById(userId);
    const isActive = firmUser?.is_active !== false && firmUser?.isActive !== false;
    if (!firmUser || !isActive) {
      throw new AppError('Acesso negado', 403, { code: 'PLATFORM_OPS_FORBIDDEN' });
    }

    const email = String(firmUser.email || '').trim().toLowerCase();
    if (!isPlatformOpsEmail(email)) {
      throw new AppError('Acesso negado', 403, { code: 'PLATFORM_OPS_FORBIDDEN' });
    }

    const mfaOn = firmUser.mfa_enabled === true || firmUser.mfaEnabled === true;
    if (!mfaOn) {
      throw new AppError('Active MFA (TOTP) antes de aceder ao Control Center', 403, {
        code: 'PLATFORM_OPS_MFA_REQUIRED',
      });
    }

    req.platformOps = {
      email,
      userId: firmUser.id,
      firmId: firmUser.firm_id || firmUser.firmId || null,
      ip: clientIp(req),
    };

    return next();
  } catch (err) {
    return next(err);
  }
}

/** Regista que um operador abriu/leu uma superfície do Center (sem PII extra). */
async function auditPlatformOpsView(req, action, metadata = {}) {
  try {
    await auditRepository.writeAuditLog({
      firmId: null,
      actorRole: 'PLATFORM_OPS',
      actorId: req.platformOps?.userId || req.user?.id,
      action,
      entityType: 'platform_ops',
      entityId: null,
      metadata: {
        ...metadata,
        email: req.platformOps?.email || null,
      },
      ipAddress: req.platformOps?.ip || clientIp(req),
    });
  } catch {
    // Nunca derrubar a leitura por falha de audit.
  }
}

module.exports = {
  requirePlatformOps,
  isPlatformOpsEmail,
  auditPlatformOpsView,
};
