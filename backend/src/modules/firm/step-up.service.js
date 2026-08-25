/**
 * Step-up para acções sigilosas (ex.: revelar acessos oficiais).
 *
 * Preferência: palavra-passe do cofre (vault_password_hash), única daquele campo.
 * Recuo: palavra-passe de login (password_hash), para quem ainda não criou a do cofre.
 * Contas Google sem nenhuma das duas: orientar a criar a palavra-passe do cofre.
 *
 * Depois de confirmar, pode emitir um JWT curto (typ=vault-stepup, 10m) purpose-bound
 * para não pedir o fator a cada clique da mesma acção. Esse JWT NÃO autentica
 * o login — o middleware de sessão rejeita-o.
 *
 * MFA/TOTP: sensitive-action.service assertVaultSensitiveUnlock.
 */
const { AppError } = require('../../middlewares/error.middleware');
const passwordCrypto = require('../../utils/password-crypto');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const {
  signVaultStepUpToken,
  verifyVaultStepUpToken,
  VAULT_STEPUP_PURPOSES,
  VAULT_STEPUP_MAX_SESSION_MS,
} = require('../../config/jwt');

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

function issueVaultStepUp({ firmId, userId, purpose, authenticatedAt }) {
  const token = signVaultStepUpToken({
    id: String(userId),
    firmId: String(firmId),
    purpose: String(purpose),
    authenticatedAt,
  });
  const payload = verifyVaultStepUpToken(token, { purpose });
  return {
    stepUpToken: token,
    stepUpExpiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
    stepUpPurpose: payload.purpose,
  };
}

function readValidStepUpToken({ firmId, userId, stepUpToken, purpose }) {
  if (!stepUpToken) return null;
  try {
    const payload = verifyVaultStepUpToken(String(stepUpToken), { purpose });
    if (String(payload.id) !== String(userId) || String(payload.firmId) !== String(firmId)) {
      return null;
    }
    // Teto absoluto: mesmo um token dentro da sua janela de 10 minutos deixa de
    // renovar-se sozinho além de VAULT_STEPUP_MAX_SESSION_MS desde a confirmação
    // real (senha/TOTP) — força nova confirmação em vez de uma sessão indefinida.
    const anchoredAtMs = Number(payload.authenticatedAt) * 1000;
    if (Number.isFinite(anchoredAtMs) && Date.now() - anchoredAtMs > VAULT_STEPUP_MAX_SESSION_MS) {
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
  purpose = VAULT_STEPUP_PURPOSES.MUTATE,
}) {
  const actor = await firmUsersRepository.findFirmUserById(userId, firmId);
  if (!actor || String(actor.firm_id) !== String(firmId) || actor.is_active === false) {
    throw new AppError('Utilizador não encontrado', 404, { code: 'USER_NOT_FOUND' });
  }

  const tokenPayload = readValidStepUpToken({ firmId, userId, stepUpToken, purpose });
  if (tokenPayload) {
    const issued =
      rememberSession !== false
        ? issueVaultStepUp({ firmId, userId, purpose, authenticatedAt: tokenPayload.authenticatedAt })
        : {};
    return { actor, ...issued };
  }

  const vaultHash = actor.vault_password_hash || null;
  const loginHash = actor.password_hash || null;
  if (!vaultHash && !loginHash) {
    throw noUnlockSecretError();
  }

  const ok = await passwordCrypto.verifyPassword(String(currentPassword || ''), vaultHash || loginHash);
  if (!ok) throw invalidUnlockError();

  const issued = rememberSession ? issueVaultStepUp({ firmId, userId, purpose }) : {};
  return { actor, ...issued };
}

module.exports = {
  verifyStaffPassword,
  actorHasLocalPassword,
  getUnlockState,
  issueVaultStepUp,
  readValidStepUpToken,
  VAULT_STEPUP_PURPOSES,
};
