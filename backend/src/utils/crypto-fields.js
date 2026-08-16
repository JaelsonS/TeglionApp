const crypto = require('crypto');
const { env } = require('../config/env');
const { logger } = require('./logger');
const { resolveEncryptionKeyBuffer, cryptoFieldsMessage } = require('./crypto-fields.resolve');

const PREFIX = 'enc:v1:';

function getKey() {
  if (!env.DATA_ENCRYPTION_KEY) {
    throw new Error(cryptoFieldsMessage('requiredEncryptionKey'));
  }
  return resolveEncryptionKeyBuffer(env.DATA_ENCRYPTION_KEY);
}

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

function encryptField(value) {
  if (value === null || value === undefined) return value;
  if (isEncrypted(value)) return value;

  const key = getKey();

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(String(value), 'utf-8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, tag, encrypted]).toString('base64url');
  return `${PREFIX}${payload}`;
}

function decryptField(value) {
  if (value === null || value === undefined) return value;
  if (!isEncrypted(value)) return value;

  const key = getKey();

  const payload = value.slice(PREFIX.length);
  const data = Buffer.from(payload, 'base64url');
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const encrypted = data.subarray(28);

  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf-8');
  } catch (error) {
    logger.safe.warn('CRYPTO_DECRYPT_FAILED', {
      reason: error?.message || 'unknown',
      instanceId: process.env.RENDER_INSTANCE_ID || process.env.HOSTNAME || 'unknown',
    });
    throw new Error('CRYPTO_DECRYPT_FAILED');
  }
}

module.exports = {
  encryptField,
  decryptField,
  isEncrypted,
  resolveEncryptionKeyBuffer,
};
