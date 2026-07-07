/**
 * Descriptografia segura para UI — evita mostrar `enc:v1:…` ou `U2FsdGVkX1…` ao utilizador.
 */
const { decryptField, isEncrypted } = require('./crypto-fields');
const { logger } = require('./logger');

const LEGACY_PREFIX = 'U2FsdGVkX1';
const FALLBACK = '[Conteúdo indisponível — contacte o escritório]';

let cryptoJs = null;
function getCryptoJs() {
  if (cryptoJs !== null) return cryptoJs;
  try {
    cryptoJs = require('crypto-js');
  } catch {
    cryptoJs = false;
  }
  return cryptoJs;
}

function looksLikeLegacyCrypto(value) {
  return typeof value === 'string' && value.startsWith(LEGACY_PREFIX);
}

function decryptLegacyCryptoJs(ciphertext) {
  const CryptoJS = getCryptoJs();
  if (!CryptoJS) return null;
  const passphrase =
    process.env.LEGACY_CRYPTO_PASSPHRASE ||
    process.env.DATA_ENCRYPTION_KEY ||
    '';
  if (!passphrase) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
    const text = bytes.toString(CryptoJS.enc.Utf8);
    return text?.trim() ? text : null;
  } catch {
    return null;
  }
}

function safeDecryptText(value) {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;

  if (isEncrypted(trimmed)) {
    try {
      return decryptField(trimmed);
    } catch (err) {
      logger.safe.warn('safeDecryptText enc:v1 failed', { message: err?.message });
      return FALLBACK;
    }
  }

  if (looksLikeLegacyCrypto(trimmed)) {
    const plain = decryptLegacyCryptoJs(trimmed);
    if (plain) return plain;
    return FALLBACK;
  }

  return value;
}

function safeDecryptDeep(obj, depth = 0) {
  if (depth > 8) return obj;
  if (typeof obj === 'string') return safeDecryptText(obj);
  if (Array.isArray(obj)) return obj.map((v) => safeDecryptDeep(v, depth + 1));
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = safeDecryptDeep(v, depth + 1);
    }
    return out;
  }
  return obj;
}

module.exports = { safeDecryptText, safeDecryptDeep, FALLBACK };
