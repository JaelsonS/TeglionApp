

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
};
