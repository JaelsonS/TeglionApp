/**
 * Step-up para acções sigilosas (ex.: revelar acessos oficiais).
 *
 * Preferência: palavra-passe do cofre (vault_password_hash), única daquele campo.
 * Recuo: palavra-passe de login (password_hash), para quem ainda não criou a do cofre.
 * Contas Google sem nenhuma das duas: orientar a criar a palavra-passe do cofre.
 *
 * Depois de confirmar, pode emitir um JWT curto (typ=vault-stepup, 8h) para
 * não pedir a senha a cada clique nesta sessão do browser. Esse JWT NÃO autentica
 * o login — o middleware de sessão rejeita-o.
 *
 * MFA/TOTP: Fase 4 — preferir `mfa.service.verifyMfaOrVaultPassword` quando o
 * cliente envia `totpCode`. Scopes completos (Fase 5) ainda não aplicam.
 */
const { AppError } = require('../../middlewares/error.middleware');
const passwordCrypto = require('../../utils/password-crypto');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const { signVaultStepUpToken, verifyVaultStepUpToken } = require('../../config/jwt');

function invalidUnlockError() {
  return new AppError('Palavra-passe incorrecta. Confirme a palavra-passe dos Acessos oficiais.', 403, {
    code: 'INVALID_CURRENT_PASSWORD',
  });
}

function noUnlockSecretError() {
  return new AppError(
    'Crie uma palavra-passe só para Acessos oficiais (Definições → O seu perfil, ou neste ecrã). Não serve para entrar no Teglion.',
    400,
    { code: 'NO_VAULT_PASSWORD' },
  );
}

function issueVaultStepUp({ firmId, userId }) {
  const token = signVaultStepUpToken({ id: String(userId), firmId: String(firmId) });
  const payload = verifyVaultStepUpToken(token);
  return {
    stepUpToken: token,
    stepUpExpiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
  };
}

function readValidStepUpToken({ firmId, userId, stepUpToken }) {
  if (!stepUpToken) return null;
  try {
    const payload = verifyVaultStepUpToken(String(stepUpToken));
    if (String(payload.id) !== String(userId) || String(payload.firmId) !== String(firmId)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

async function getUnlockState({ firmId, userId }) {
  const actor = await firmUsersRepository.findFirmUserById(userId, firmId);
  if (!actor || String(actor.firm_id) !== String(firmId) || actor.is_active === false) {
    return { hasVaultPassword: false, hasLocalPassword: false, canUnlock: false };
  }
  const hasVaultPassword = Boolean(actor.vault_password_hash);
  const hasLocalPassword = Boolean(actor.password_hash);
  return { hasVaultPassword, hasLocalPassword, canUnlock: hasVaultPassword || hasLocalPassword };
}

async function actorHasLocalPassword({ firmId, userId }) {
  const state = await getUnlockState({ firmId, userId });
  return state.hasLocalPassword;
}

async function verifyStaffPassword({
  firmId,
  userId,
  currentPassword,
  stepUpToken = null,
  rememberSession = false,
}) {
  const actor = await firmUsersRepository.findFirmUserById(userId, firmId);
  if (!actor || String(actor.firm_id) !== String(firmId) || actor.is_active === false) {
    throw new AppError('Utilizador não encontrado', 404, { code: 'USER_NOT_FOUND' });
  }

  const tokenPayload = readValidStepUpToken({ firmId, userId, stepUpToken });
  if (tokenPayload) {
    const issued = rememberSession !== false ? issueVaultStepUp({ firmId, userId }) : {};
    return { actor, ...issued };
  }

  const vaultHash = actor.vault_password_hash || null;
  const loginHash = actor.password_hash || null;
  if (!vaultHash && !loginHash) {
    throw noUnlockSecretError();
  }

  const ok = await passwordCrypto.verifyPassword(String(currentPassword || ''), vaultHash || loginHash);
  if (!ok) throw invalidUnlockError();

  const issued = rememberSession ? issueVaultStepUp({ firmId, userId }) : {};
  return { actor, ...issued };
}

module.exports = {
  verifyStaffPassword,
  actorHasLocalPassword,
  getUnlockState,
  issueVaultStepUp,
  readValidStepUpToken,
};
