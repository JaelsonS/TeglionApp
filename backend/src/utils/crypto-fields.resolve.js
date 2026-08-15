/**
 * Resolvedor puro da DATA_ENCRYPTION_KEY — sem dependência de env.js
 * (permite unit test sem secrets JWT/Supabase).
 */
const CRYPTO_FIELDS_MESSAGES = {
  requiredEncryptionKey: 'DATA_ENCRYPTION_KEY é obrigatório para criptografia de dados sensíveis',
  invalidEncryptionKeyLength: 'DATA_ENCRYPTION_KEY deve ter 32 bytes em base64',
};

function cryptoFieldsMessage(key) {
  return CRYPTO_FIELDS_MESSAGES[key] || key;
}

/**
 * Aceita:
 * - base64 que decodifica para exactamente 32 bytes (formato documentado)
 * - hex de 64 chars (= 32 bytes) — formato usado em vários envs staging/legacy
 * @param {string} raw
 * @returns {Buffer}
 */
function resolveEncryptionKeyBuffer(raw) {
  const value = String(raw || '').trim();
  if (!value) {
    throw new Error(cryptoFieldsMessage('requiredEncryptionKey'));
  }
  if (/^[0-9a-fA-F]{64}$/.test(value)) {
    return Buffer.from(value, 'hex');
  }
  const key = Buffer.from(value, 'base64');
  if (key.length !== 32) {
    throw new Error(cryptoFieldsMessage('invalidEncryptionKeyLength'));
  }
  return key;
}

module.exports = { resolveEncryptionKeyBuffer, cryptoFieldsMessage };
