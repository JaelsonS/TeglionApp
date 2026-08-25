/**
 * Confirmação central para acções HIGH/CRITICAL (Gate 2).
 *
 * Uma única API de verificação — não espalhar MFA/password pelos controllers.
 *
 * Política:
 * - MFA activo → TOTP obrigatório (nunca email/SMS; nunca só sessão).
 * - MFA inactivo → palavra-passe de login obrigatória.
 * - Conta Google sem password e sem MFA → STEP_UP_FACTOR_UNAVAILABLE.
 *
 * Vault: MFA activo → TOTP ou step-up JWT (TTL inalterado neste Gate).
 * MFA inactivo → password do cofre/login (step-up.service).
 */
const { AppError } = require('../../middlewares/error.middleware');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const passwordCrypto = require('../../utils/password-crypto');
const { decryptField } = require('../../utils/crypto-fields');

const SENSITIVE_PURPOSES = Object.freeze({
  PROFILE_EMAIL_CHANGE: 'profile_email_change',
  PROFILE_PASSWORD_CHANGE: 'profile_password_change',
  FIRM_CLOSE: 'firm_close',
  TEAM_PERMISSIONS_PATCH: 'team_permissions_patch',
  TEAM_MEMBER_DEACTIVATE: 'team_member_deactivate',
  TEAM_MEMBER_REACTIVATE: 'team_member_reactivate',
  TEAM_MEMBER_ROLE_CHANGE: 'team_member_role_change',
  TEAM_MEMBER_CREATE: 'team_member_create',
  TEAM_MEMBER_EMAIL_CHANGE: 'team_member_email_change',
  VAULT_REVEAL: 'vault_reveal',
  VAULT_MUTATE: 'vault_mutate',
  VAULT_IMPORT: 'vault_import',
});

const PURPOSE_SET = new Set(Object.values(SENSITIVE_PURPOSES));

function invalidCodeError() {
  return new AppError('Não foi possível confirmar esta operação.', 401, {
    code: 'SENSITIVE_ACTION_DENIED',
  });
}

function mfaRequiredError() {
  return new AppError(
    'Para confirmar esta operação, introduza o código de segurança gerado pela aplicação autenticadora configurada na sua conta.',
    403,
    { code: 'SENSITIVE_ACTION_MFA_REQUIRED' },
  );
}

function passwordRequiredError() {
  return new AppError('Para confirmar esta operação, introduza a sua palavra-passe de login.', 403, {
    code: 'SENSITIVE_ACTION_PASSWORD_REQUIRED',
  });
}

function factorUnavailableError() {
  return new AppError(
    'Configure autenticação de dois factores ou uma palavra-passe de login antes desta operação.',
    400,
    { code: 'STEP_UP_FACTOR_UNAVAILABLE' },
  );
}

async function loadActor(firmId, userId) {
  const row = await firmUsersRepository.findFirmUserById(userId, firmId);
  if (!row || String(row.firm_id) !== String(firmId) || row.is_active === false) {
    throw new AppError('Utilizador não encontrado', 404, { code: 'USER_NOT_FOUND' });
  }
  return row;
}

async function verifyTotpForActor(row, totpCode) {
  if (!row.mfa_enabled || !row.mfa_totp_secret_enc) {
    throw mfaRequiredError();
  }
  const mfa = require('../auth/mfa.service');
  const secretPlain = decryptField(row.mfa_totp_secret_enc);
  const ok = await mfa.verifyTotpCode(secretPlain, totpCode, row.id);
  if (!ok) throw invalidCodeError();
  await firmUsersRepository.updateFirmUserMfa(row.id, row.firm_id, {
    mfaLastVerifiedAt: new Date().toISOString(),
  });
}

/**
 * Confirma acção de conta/admin (não reutiliza vault-stepup JWT).
 */
async function confirmSensitiveAction({
  firmId,
  userId,
  purpose,
  totpCode = null,
  currentPassword = null,
}) {
  if (!PURPOSE_SET.has(purpose)) {
    throw new AppError('Operação sensível inválida.', 400, { code: 'SENSITIVE_PURPOSE_INVALID' });
  }

  const actor = await loadActor(firmId, userId);
  const mfaOn = actor.mfa_enabled === true;

  if (mfaOn) {
    if (!totpCode || !String(totpCode).trim()) throw mfaRequiredError();
    await verifyTotpForActor(actor, String(totpCode).trim());
    return { actor, method: 'mfa_totp', purpose, mfaEnabled: true };
  }

  if (!actor.password_hash) throw factorUnavailableError();
  if (!currentPassword || !String(currentPassword)) throw passwordRequiredError();
  const ok = await passwordCrypto.verifyPassword(String(currentPassword), actor.password_hash);
  if (!ok) throw invalidCodeError();
  return { actor, method: 'password', purpose, mfaEnabled: false };
}

/**
 * Unlock vault com purpose explícito. TTL do step-up JWT: Gate 3.
 */
async function assertVaultSensitiveUnlock({
  firmId,
  userId,
  purpose,
  totpCode = null,
  currentPassword = null,
  stepUpToken = null,
  rememberSession = false,
}) {
  if (
    purpose !== SENSITIVE_PURPOSES.VAULT_REVEAL &&
    purpose !== SENSITIVE_PURPOSES.VAULT_MUTATE &&
    purpose !== SENSITIVE_PURPOSES.VAULT_IMPORT
  ) {
    throw new AppError('Operação de cofre inválida.', 400, { code: 'SENSITIVE_PURPOSE_INVALID' });
  }

  const actor = await loadActor(firmId, userId);
  const stepUp = require('../firm/step-up.service');

  if (actor.mfa_enabled === true) {
    const tokenPayload = stepUp.readValidStepUpToken({ firmId, userId, stepUpToken, purpose });
    if (tokenPayload) {
      const issued =
        rememberSession !== false
          ? stepUp.issueVaultStepUp({ firmId, userId, purpose, authenticatedAt: tokenPayload.authenticatedAt })
          : {};
      return { actor, method: 'vault_stepup', purpose, mfaEnabled: true, ...issued };
    }
    if (!totpCode || !String(totpCode).trim()) throw mfaRequiredError();
    await verifyTotpForActor(actor, String(totpCode).trim());
    const issued = rememberSession ? stepUp.issueVaultStepUp({ firmId, userId, purpose }) : {};
    return { actor, method: 'mfa_totp', purpose, mfaEnabled: true, ...issued };
  }

  return stepUp.verifyStaffPassword({
    firmId,
    userId,
    currentPassword,
    stepUpToken,
    rememberSession,
    purpose,
  }).then((result) => ({ ...result, purpose, method: result.method || 'vault_password', mfaEnabled: false }));
}

module.exports = {
  SENSITIVE_PURPOSES,
  confirmSensitiveAction,
  assertVaultSensitiveUnlock,
  mfaRequiredError,
  passwordRequiredError,
};
