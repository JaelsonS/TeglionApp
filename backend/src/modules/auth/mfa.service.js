/**
 * MFA TOTP (Fase 4) — enrollment, challenge, recovery codes.
 * Segredos: encryptField (AES-256-GCM). Recovery: Argon2id hashes, one-time.
 * Challenge JWT (typ=mfa-challenge) NÃO é sessão completa.
 */
const crypto = require('crypto');
const { generateSecret, generateURI, verify: verifyTotp } = require('otplib');
const { AppError } = require('../../middlewares/error.middleware');
const { encryptField, decryptField } = require('../../utils/crypto-fields');
const { hashPassword, verifyPassword } = require('../../utils/password-crypto');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const authRefreshSessionsRepository = require('../../db/supabase/repositories/auth-refresh-sessions.repository');
const { signMfaChallengeToken, verifyMfaChallengeToken, MFA_PURPOSES } = require('../../config/jwt');
const securityAudit = require('../../services/audit/security-audit.service');

const ISSUER = 'Teglion';
const RECOVERY_CODE_COUNT = 10;
const TOTP_EPOCH_TOLERANCE_SEC = 30;

const STATUS = Object.freeze({
  AUTHENTICATED: 'AUTHENTICATED',
  MFA_CHALLENGE_REQUIRED: 'MFA_CHALLENGE_REQUIRED',
  MFA_ENROLLMENT_REQUIRED: 'MFA_ENROLLMENT_REQUIRED',
});

function isOwnerRole(role) {
  return String(role || '') === 'FIRM_OWNER';
}

function mfaRequiredForRole(role) {
  return isOwnerRole(role);
}

function invalidMfaCodeError() {
  return new AppError('Código MFA inválido.', 401, { code: 'MFA_INVALID_CODE' });
}

function assertSameTenant(row, firmId) {
  if (!row || String(row.firm_id) !== String(firmId)) {
    throw new AppError('Acesso negado', 403, { code: 'TENANT_MISMATCH' });
  }
}

function partialMfaUser(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: firmUsersRepository.jwtRoleFromFirmRole(row.role),
    firmRole: row.role,
    firmId: row.firm_id,
    mfaEnabled: row.mfa_enabled === true,
  };
}

function issueChallengeForUser(row, purpose) {
  const { token, jti } = signMfaChallengeToken({
    id: String(row.id),
    firmId: String(row.firm_id),
    purpose,
  });
  const payload = verifyMfaChallengeToken(token);
  return {
    challengeToken: token,
    jti,
    purpose,
    expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
  };
}

/**
 * Após password/SSO válidos: decide sessão completa vs enrollment vs challenge.
 */
function resolvePostCredentialGate(row) {
  const enabled = row.mfa_enabled === true;
  if (enabled) {
    const challenge = issueChallengeForUser(row, MFA_PURPOSES.VERIFY);
    return {
      status: STATUS.MFA_CHALLENGE_REQUIRED,
      mfa: challenge,
      user: partialMfaUser(row),
    };
  }
  if (mfaRequiredForRole(row.role)) {
    const challenge = issueChallengeForUser(row, MFA_PURPOSES.ENROLL);
    return {
      status: STATUS.MFA_ENROLLMENT_REQUIRED,
      mfa: challenge,
      user: partialMfaUser(row),
    };
  }
  return { status: STATUS.AUTHENTICATED };
}

async function verifyTotpCode(secretPlain, code) {
  const token = String(code || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(token)) return false;
  const result = await verifyTotp({
    token,
    secret: secretPlain,
    epochTolerance: TOTP_EPOCH_TOLERANCE_SEC,
  });
  return Boolean(result && result.valid);
}

function generateRecoveryCodesPlain() {
  const codes = [];
  for (let i = 0; i < RECOVERY_CODE_COUNT; i += 1) {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase();
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return codes;
}

async function hashRecoveryCodes(codes) {
  const hashes = [];
  for (const code of codes) {
    hashes.push(await hashPassword(String(code).trim().toUpperCase()));
  }
  return hashes;
}

async function consumeRecoveryCode(hashes, plainCode) {
  const normalized = String(plainCode || '').trim().toUpperCase();
  if (!normalized || !Array.isArray(hashes) || hashes.length === 0) {
    return { ok: false, remaining: hashes || [] };
  }
  const remaining = [];
  let matched = false;
  for (const hash of hashes) {
    if (!matched && (await verifyPassword(normalized, hash))) {
      matched = true;
      continue;
    }
    remaining.push(hash);
  }
  return { ok: matched, remaining };
}

function readChallengeToken(raw) {
  try {
    return verifyMfaChallengeToken(String(raw || ''));
  } catch {
    throw new AppError('Desafio MFA inválido ou expirado.', 401, { code: 'MFA_CHALLENGE_INVALID' });
  }
}

async function loadActorFromChallenge(payload, { purposes } = {}) {
  if (purposes && !purposes.includes(payload.purpose)) {
    throw new AppError('Desafio MFA inválido para esta operação.', 403, { code: 'MFA_PURPOSE_DENIED' });
  }
  const row = await firmUsersRepository.findFirmUserById(payload.id, payload.firmId);
  assertSameTenant(row, payload.firmId);
  if (!row || row.is_active === false) {
    throw new AppError('Utilizador não encontrado', 404, { code: 'USER_NOT_FOUND' });
  }
  return row;
}

async function getStatusFromChallenge({ challengeToken }) {
  const payload = readChallengeToken(challengeToken);
  const row = await loadActorFromChallenge(payload);
  return {
    status:
      payload.purpose === MFA_PURPOSES.ENROLL
        ? STATUS.MFA_ENROLLMENT_REQUIRED
        : STATUS.MFA_CHALLENGE_REQUIRED,
    purpose: payload.purpose,
    expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
    user: partialMfaUser(row),
    mfaEnabled: row.mfa_enabled === true,
  };
}

async function getStatusForSessionUser({ userId, firmId }) {
  const row = await firmUsersRepository.findFirmUserById(userId, firmId);
  assertSameTenant(row, firmId);
  return {
    mfaEnabled: row.mfa_enabled === true,
    mfaEnabledAt: row.mfa_enabled_at || null,
    recoveryCodesRemaining: Array.isArray(row.mfa_recovery_codes_hash)
      ? row.mfa_recovery_codes_hash.length
      : 0,
    required: mfaRequiredForRole(row.role),
    user: partialMfaUser(row),
  };
}

/**
 * Inicia enrollment: gera segredo TOTP, guarda encrypted em pending, devolve otpauth URI.
 */
async function beginEnrollment({ challengeToken, sessionUser = null }) {
  let row;
  let firmId;
  if (challengeToken) {
    const payload = readChallengeToken(challengeToken);
    row = await loadActorFromChallenge(payload, {
      purposes: [MFA_PURPOSES.ENROLL, MFA_PURPOSES.VERIFY],
    });
    firmId = payload.firmId;
    if (row.mfa_enabled === true && payload.purpose === MFA_PURPOSES.VERIFY) {
      throw new AppError('MFA já está activo. Desactive antes de reconfigurar.', 409, {
        code: 'MFA_ALREADY_ENABLED',
      });
    }
  } else if (sessionUser?.id && sessionUser?.firmId) {
    row = await firmUsersRepository.findFirmUserById(sessionUser.id, sessionUser.firmId);
    assertSameTenant(row, sessionUser.firmId);
    firmId = sessionUser.firmId;
    if (row.mfa_enabled === true) {
      throw new AppError('MFA já está activo. Desactive antes de reconfigurar.', 409, {
        code: 'MFA_ALREADY_ENABLED',
      });
    }
    if (mfaRequiredForRole(row.role) && !challengeToken) {
      throw new AppError('É necessário o token de enrollment MFA.', 401, {
        code: 'MFA_ENROLLMENT_REQUIRED',
      });
    }
  } else {
    throw new AppError('Desafio MFA ausente.', 401, { code: 'MFA_CHALLENGE_MISSING' });
  }

  const secret = generateSecret();
  const otpauthUrl = await generateURI({
    issuer: ISSUER,
    label: String(row.email || row.id),
    secret,
  });
  const pendingEnc = encryptField(secret);
  await firmUsersRepository.updateFirmUserMfa(row.id, firmId, {
    mfaTotpPendingSecretEnc: pendingEnc,
  });

  void securityAudit.recordSecurityEvent({
    firmId,
    actorRole: firmUsersRepository.jwtRoleFromFirmRole(row.role),
    actorId: row.id,
    action: 'mfa.enroll.begin',
    entityType: 'firm_user',
    entityId: row.id,
    metadata: { hasPending: true },
  });

  return { otpauthUrl };
}

async function confirmEnrollment({ challengeToken, sessionUser = null, code, req = null }) {
  let row;
  let firmId;
  let fromChallenge = false;
  if (challengeToken) {
    const payload = readChallengeToken(challengeToken);
    row = await loadActorFromChallenge(payload, {
      purposes: [MFA_PURPOSES.ENROLL, MFA_PURPOSES.VERIFY],
    });
    firmId = payload.firmId;
    fromChallenge = true;
  } else if (sessionUser?.id && sessionUser?.firmId) {
    row = await firmUsersRepository.findFirmUserById(sessionUser.id, sessionUser.firmId);
    assertSameTenant(row, sessionUser.firmId);
    firmId = sessionUser.firmId;
    if (mfaRequiredForRole(row.role) && !row.mfa_enabled) {
      throw new AppError('É necessário o token de enrollment MFA.', 401, {
        code: 'MFA_ENROLLMENT_REQUIRED',
      });
    }
  } else {
    throw new AppError('Desafio MFA ausente.', 401, { code: 'MFA_CHALLENGE_MISSING' });
  }

  if (!row.mfa_totp_pending_secret_enc) {
    throw new AppError('Inicie o enrollment MFA primeiro.', 400, { code: 'MFA_ENROLL_NOT_STARTED' });
  }

  let secretPlain;
  try {
    secretPlain = decryptField(row.mfa_totp_pending_secret_enc);
  } catch {
    throw new AppError('Segredo MFA inválido. Reinicie o enrollment.', 500, { code: 'MFA_SECRET_CORRUPT' });
  }

  const ok = await verifyTotpCode(secretPlain, code);
  if (!ok) {
    void securityAudit.recordSecurityEvent({
      firmId,
      actorRole: firmUsersRepository.jwtRoleFromFirmRole(row.role),
      actorId: row.id,
      action: 'mfa.enroll.confirm_failed',
      entityType: 'firm_user',
      entityId: row.id,
      metadata: {},
      req,
    });
    throw invalidMfaCodeError();
  }

  const recoveryPlain = generateRecoveryCodesPlain();
  const recoveryHashes = await hashRecoveryCodes(recoveryPlain);
  const now = new Date().toISOString();
  await firmUsersRepository.updateFirmUserMfa(row.id, firmId, {
    mfaEnabled: true,
    mfaTotpSecretEnc: encryptField(secretPlain),
    mfaTotpPendingSecretEnc: null,
    mfaRecoveryCodesHash: recoveryHashes,
    mfaEnabledAt: now,
    mfaLastVerifiedAt: now,
  });

  await authRefreshSessionsRepository.deleteAllForActor('firm_user', row.id).catch(() => {});

  void securityAudit.recordSecurityEvent({
    firmId,
    actorRole: firmUsersRepository.jwtRoleFromFirmRole(row.role),
    actorId: row.id,
    action: 'mfa.enroll.confirmed',
    entityType: 'firm_user',
    entityId: row.id,
    metadata: { recoveryCodesIssued: recoveryPlain.length, fromChallenge },
    req,
  });

  return {
    recoveryCodes: recoveryPlain,
    user: partialMfaUser({ ...row, mfa_enabled: true }),
  };
}

async function verifyChallenge({ challengeToken, code, recoveryCode, req = null }) {
  const payload = readChallengeToken(challengeToken);
  const row = await loadActorFromChallenge(payload, { purposes: [MFA_PURPOSES.VERIFY] });

  if (!row.mfa_enabled || !row.mfa_totp_secret_enc) {
    throw new AppError('MFA não está configurado.', 400, { code: 'MFA_NOT_ENABLED' });
  }

  if (recoveryCode) {
    const hashes = Array.isArray(row.mfa_recovery_codes_hash) ? row.mfa_recovery_codes_hash : [];
    const consumed = await consumeRecoveryCode(hashes, recoveryCode);
    if (!consumed.ok) {
      void securityAudit.recordSecurityEvent({
        firmId: payload.firmId,
        actorRole: firmUsersRepository.jwtRoleFromFirmRole(row.role),
        actorId: row.id,
        action: 'mfa.challenge.recovery_failed',
        entityType: 'firm_user',
        entityId: row.id,
        req,
      });
      throw invalidMfaCodeError();
    }
    await firmUsersRepository.updateFirmUserMfa(row.id, payload.firmId, {
      mfaRecoveryCodesHash: consumed.remaining,
      mfaLastVerifiedAt: new Date().toISOString(),
    });
    void securityAudit.recordSecurityEvent({
      firmId: payload.firmId,
      actorRole: firmUsersRepository.jwtRoleFromFirmRole(row.role),
      actorId: row.id,
      action: 'mfa.challenge.recovery_ok',
      entityType: 'firm_user',
      entityId: row.id,
      metadata: { remaining: consumed.remaining.length },
      req,
    });
  } else {
    let secretPlain;
    try {
      secretPlain = decryptField(row.mfa_totp_secret_enc);
    } catch {
      throw new AppError('Segredo MFA inválido.', 500, { code: 'MFA_SECRET_CORRUPT' });
    }
    const verified = await verifyTotpCode(secretPlain, code);
    if (!verified) {
      void securityAudit.recordSecurityEvent({
        firmId: payload.firmId,
        actorRole: firmUsersRepository.jwtRoleFromFirmRole(row.role),
        actorId: row.id,
        action: 'mfa.challenge.failed',
        entityType: 'firm_user',
        entityId: row.id,
        req,
      });
      throw invalidMfaCodeError();
    }
    await firmUsersRepository.updateFirmUserMfa(row.id, payload.firmId, {
      mfaLastVerifiedAt: new Date().toISOString(),
    });
    void securityAudit.recordSecurityEvent({
      firmId: payload.firmId,
      actorRole: firmUsersRepository.jwtRoleFromFirmRole(row.role),
      actorId: row.id,
      action: 'mfa.challenge.ok',
      entityType: 'firm_user',
      entityId: row.id,
      req,
    });
  }

  return { row, verified: true };
}

async function disableMfa({ userId, firmId, code, recoveryCode, req = null }) {
  const row = await firmUsersRepository.findFirmUserById(userId, firmId);
  assertSameTenant(row, firmId);
  if (!row.mfa_enabled) {
    throw new AppError('MFA não está activo.', 400, { code: 'MFA_NOT_ENABLED' });
  }
  if (mfaRequiredForRole(row.role)) {
    throw new AppError('O proprietário do escritório não pode desactivar o MFA.', 403, {
      code: 'MFA_REQUIRED_FOR_OWNER',
    });
  }

  let ok = false;
  if (recoveryCode) {
    const consumed = await consumeRecoveryCode(row.mfa_recovery_codes_hash || [], recoveryCode);
    ok = consumed.ok;
  } else {
    const secretPlain = decryptField(row.mfa_totp_secret_enc);
    ok = await verifyTotpCode(secretPlain, code);
  }
  if (!ok) throw invalidMfaCodeError();

  await firmUsersRepository.updateFirmUserMfa(row.id, firmId, {
    mfaEnabled: false,
    mfaTotpSecretEnc: null,
    mfaTotpPendingSecretEnc: null,
    mfaRecoveryCodesHash: [],
    mfaEnabledAt: null,
    mfaLastVerifiedAt: null,
  });

  void securityAudit.recordSecurityEvent({
    firmId,
    actorRole: firmUsersRepository.jwtRoleFromFirmRole(row.role),
    actorId: row.id,
    action: 'mfa.disable',
    entityType: 'firm_user',
    entityId: row.id,
    req,
  });

  return { mfaEnabled: false };
}

async function regenerateRecoveryCodes({ userId, firmId, code, req = null }) {
  const row = await firmUsersRepository.findFirmUserById(userId, firmId);
  assertSameTenant(row, firmId);
  if (!row.mfa_enabled || !row.mfa_totp_secret_enc) {
    throw new AppError('MFA não está activo.', 400, { code: 'MFA_NOT_ENABLED' });
  }
  const secretPlain = decryptField(row.mfa_totp_secret_enc);
  const ok = await verifyTotpCode(secretPlain, code);
  if (!ok) throw invalidMfaCodeError();

  const recoveryPlain = generateRecoveryCodesPlain();
  const recoveryHashes = await hashRecoveryCodes(recoveryPlain);
  await firmUsersRepository.updateFirmUserMfa(row.id, firmId, {
    mfaRecoveryCodesHash: recoveryHashes,
    mfaLastVerifiedAt: new Date().toISOString(),
  });

  void securityAudit.recordSecurityEvent({
    firmId,
    actorRole: firmUsersRepository.jwtRoleFromFirmRole(row.role),
    actorId: row.id,
    action: 'mfa.recovery.regenerated',
    entityType: 'firm_user',
    entityId: row.id,
    metadata: { count: recoveryPlain.length },
    req,
  });

  return { recoveryCodes: recoveryPlain };
}

/**
 * Step-up mínimo (Fase 4): TOTP em sessão, ou password do cofre (existente).
 * Scopes completos ficam para Fase 5.
 */
async function verifyMfaOrVaultPassword({
  firmId,
  userId,
  totpCode = null,
  currentPassword = null,
  stepUpToken = null,
  rememberSession = false,
  purpose = 'vault_credentials_view',
}) {
  const stepUp = require('../firm/step-up.service');
  if (totpCode) {
    const row = await firmUsersRepository.findFirmUserById(userId, firmId);
    assertSameTenant(row, firmId);
    if (!row.mfa_enabled || !row.mfa_totp_secret_enc) {
      throw new AppError('MFA não está activo nesta conta.', 400, { code: 'MFA_NOT_ENABLED' });
    }
    const secretPlain = decryptField(row.mfa_totp_secret_enc);
    const ok = await verifyTotpCode(secretPlain, totpCode);
    if (!ok) throw invalidMfaCodeError();
    await firmUsersRepository.updateFirmUserMfa(row.id, firmId, {
      mfaLastVerifiedAt: new Date().toISOString(),
    });
    const issued = rememberSession ? stepUp.issueVaultStepUp({ firmId, userId }) : {};
    return { actor: row, method: 'mfa_totp', purpose, ...issued };
  }
  return stepUp.verifyStaffPassword({
    firmId,
    userId,
    currentPassword,
    stepUpToken,
    rememberSession,
  });
}

module.exports = {
  STATUS,
  MFA_PURPOSES,
  mfaRequiredForRole,
  resolvePostCredentialGate,
  issueChallengeForUser,
  getStatusFromChallenge,
  getStatusForSessionUser,
  beginEnrollment,
  confirmEnrollment,
  verifyChallenge,
  disableMfa,
  regenerateRecoveryCodes,
  verifyMfaOrVaultPassword,
  generateRecoveryCodesPlain,
  hashRecoveryCodes,
  consumeRecoveryCode,
  verifyTotpCode,
};
