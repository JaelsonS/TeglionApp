/**
 * Hash de palavras-passe: Argon2id (preferido) + bcrypt legado (migração transparente no login).
 */
const bcrypt = require('bcryptjs');
const argon2 = require('argon2');

const BCRYPT_ROUNDS = 12;

function isBcryptHash(hash) {
  return typeof hash === 'string' && /^\$2[aby]\$/.test(hash);
}

function isArgon2Hash(hash) {
  return typeof hash === 'string' && hash.startsWith('$argon2');
}

async function hashPassword(plain) {
  return argon2.hash(String(plain), {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

async function verifyPassword(plain, storedHash) {
  if (!storedHash) return false;
  const value = String(plain || '');
  const hash = String(storedHash);

  if (isArgon2Hash(hash)) {
    try {
      return await argon2.verify(hash, value);
    } catch {
      return false;
    }
  }

  if (isBcryptHash(hash)) {
    return bcrypt.compare(value, hash);
  }

  return false;
}

function needsPasswordRehash(storedHash) {
  return isBcryptHash(storedHash);
}

/** Compatibilidade pontual (scripts de teste legados). */
async function hashPasswordBcrypt(plain) {
  return bcrypt.hash(String(plain), BCRYPT_ROUNDS);
}

module.exports = {
  hashPassword,
  verifyPassword,
  needsPasswordRehash,
  hashPasswordBcrypt,
  isBcryptHash,
  isArgon2Hash,
};
