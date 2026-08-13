/**
 * Redacção de secrets em logs/erros do pipeline de backup.
 * Nunca deve deixar passar connection strings, passwords ou tokens R2.
 */

const SENSITIVE_PATTERNS = [
  // postgres URIs with credentials
  /postgres(?:ql)?:\/\/[^\s"'\\]+/gi,
  // generic user:pass@host
  /([a-z0-9._%+-]+):([^@\s/'"]+)@/gi,
  // AWS/R2 style keys (long base64-ish)
  /(?:AKIA|ASIA)[A-Z0-9]{16}/g,
  /R2_SECRET_ACCESS_KEY[=:\s]+[^\s"'\\]+/gi,
  /R2_ACCESS_KEY_ID[=:\s]+[^\s"'\\]+/gi,
  /BACKUP_DATABASE_URL[=:\s]+[^\s"'\\]+/gi,
  /password[=:\s]+[^\s"'\\]+/gi,
  /secretAccessKey[=:\s]+[^\s"'\\]+/gi,
];

function redactSecrets(input) {
  if (input == null) return input;
  if (typeof input !== 'string') {
    try {
      return redactSecrets(JSON.stringify(input));
    } catch {
      return '[unserializable]';
    }
  }
  let out = input;
  for (const pattern of SENSITIVE_PATTERNS) {
    out = out.replace(pattern, (match) => {
      if (/postgres(?:ql)?:\/\//i.test(match)) return 'postgresql://[REDACTED]';
      if (match.includes('@')) return '[REDACTED_CREDENTIALS]@';
      if (/^AKIA|^ASIA/i.test(match)) return '[REDACTED_ACCESS_KEY]';
      return '[REDACTED]';
    });
  }
  return out;
}

function safeErrorMessage(err) {
  const raw = err && err.message ? String(err.message) : String(err || 'unknown error');
  return redactSecrets(raw).slice(0, 500);
}

module.exports = {
  redactSecrets,
  safeErrorMessage,
  SENSITIVE_PATTERNS,
};
