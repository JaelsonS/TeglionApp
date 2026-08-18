

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
const VAULT_STEPUP_EXPIRES_IN = '8h';

function signVaultStepUpToken({ id, firmId }) {
  return jwt.sign(
    { typ: VAULT_STEPUP_TYP, id, firmId },
    env.JWT_ACCESS_SECRET,
    { expiresIn: VAULT_STEPUP_EXPIRES_IN },
  );
}

function verifyVaultStepUpToken(token) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (!payload || payload.typ !== VAULT_STEPUP_TYP || !payload.id || !payload.firmId) {
    const err = new Error('INVALID_VAULT_STEPUP');
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
    jwt.verify(token, env.JWT_ACCESS_SECRET);
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
};
