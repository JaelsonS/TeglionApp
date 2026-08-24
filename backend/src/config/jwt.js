

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { env } = require('./env');

function generateId(length = 24) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

function signRefreshToken(payload) {
  
  const jti = generateId(24);
  return {
    jti,
    token: jwt.sign({ ...payload, jti }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    }),
  };
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

const VAULT_STEPUP_TYP = 'vault-stepup';
/** Produção: curto e purpose-bound (Gate 3 / main release). */
const VAULT_STEPUP_EXPIRES_IN = '10m';
const VAULT_STEPUP_PURPOSES = Object.freeze({
  REVEAL: 'vault_reveal',
  MUTATE: 'vault_mutate',
  IMPORT: 'vault_import',
});

function signVaultStepUpToken({ id, firmId, purpose }) {
  if (!id || !firmId || !purpose) {
    throw new Error('VAULT_STEPUP_PAYLOAD_INCOMPLETE');
  }
  if (!Object.values(VAULT_STEPUP_PURPOSES).includes(purpose)) {
    throw new Error('VAULT_STEPUP_PURPOSE_INVALID');
  }
  return jwt.sign(
    { typ: VAULT_STEPUP_TYP, id, firmId, purpose },
    env.JWT_ACCESS_SECRET,
    { expiresIn: VAULT_STEPUP_EXPIRES_IN },
  );
}

function verifyVaultStepUpToken(token, { purpose } = {}) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (!payload || payload.typ !== VAULT_STEPUP_TYP || !payload.id || !payload.firmId || !payload.purpose) {
    const err = new Error('INVALID_VAULT_STEPUP');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  if (!Object.values(VAULT_STEPUP_PURPOSES).includes(payload.purpose)) {
    const err = new Error('INVALID_VAULT_STEPUP_PURPOSE');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  if (purpose && String(payload.purpose) !== String(purpose)) {
    const err = new Error('VAULT_STEPUP_PURPOSE_MISMATCH');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return payload;
}

const MFA_CHALLENGE_TYP = 'mfa-challenge';
const MFA_CHALLENGE_EXPIRES_IN = '5m';
const MFA_PURPOSES = Object.freeze({
  VERIFY: 'mfa_verify',
  ENROLL: 'mfa_enroll',
});

/**
 * JWT curto — NÃO é sessão autenticada.
 * Middleware de sessão deve rejeitar typ=mfa-challenge.
 */
function signMfaChallengeToken({ id, firmId, purpose }) {
  if (!id || !firmId || !purpose) {
    throw new Error('MFA_CHALLENGE_PAYLOAD_INCOMPLETE');
  }
  if (!Object.values(MFA_PURPOSES).includes(purpose)) {
    throw new Error('MFA_CHALLENGE_PURPOSE_INVALID');
  }
  const jti = generateId(24);
  const token = jwt.sign(
    { typ: MFA_CHALLENGE_TYP, id, firmId, purpose, jti },
    env.JWT_ACCESS_SECRET,
    { expiresIn: MFA_CHALLENGE_EXPIRES_IN },
  );
  return { token, jti };
}

function verifyMfaChallengeToken(token) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (
    !payload ||
    payload.typ !== MFA_CHALLENGE_TYP ||
    !payload.id ||
    !payload.firmId ||
    !payload.purpose ||
    !payload.jti
  ) {
    const err = new Error('INVALID_MFA_CHALLENGE');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  if (!Object.values(MFA_PURPOSES).includes(payload.purpose)) {
    const err = new Error('INVALID_MFA_CHALLENGE_PURPOSE');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return payload;
}

function isAccessTokenSignatureValid(token) {
  if (!token || typeof token !== 'string') return false;
  try {
    jwt.verify(token, env.JWT_ACCESS_SECRET, { ignoreExpiration: true });
    return true;
  } catch {
    return false;
  }
}

function isAccessTokenValid(token) {
  if (!token || typeof token !== 'string') return false;
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (payload?.typ === VAULT_STEPUP_TYP || payload?.typ === MFA_CHALLENGE_TYP) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  isAccessTokenSignatureValid,
  isAccessTokenValid,
  signVaultStepUpToken,
  verifyVaultStepUpToken,
  VAULT_STEPUP_TYP,
  VAULT_STEPUP_EXPIRES_IN,
  VAULT_STEPUP_PURPOSES,
  signMfaChallengeToken,
  verifyMfaChallengeToken,
  MFA_CHALLENGE_TYP,
  MFA_CHALLENGE_EXPIRES_IN,
  MFA_PURPOSES,
};
