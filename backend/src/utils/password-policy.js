/**
 * Política de palavra-passe — registo, reset e convites.
 * Login aceita palavras-passe antigas (validação mínima separada nas rotas).
 */
const { AppError } = require('../middlewares/error.middleware');

const PASSWORD_MIN_LENGTH = 10;

const PASSWORD_POLICY_MESSAGES = {
  minLength: `A palavra-passe deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  lowercase: 'Inclua pelo menos uma letra minúscula.',
  uppercase: 'Inclua pelo menos uma letra maiúscula.',
  digit: 'Inclua pelo menos um número.',
};

function validatePasswordPolicy(password) {
  const value = String(password || '');
  if (value.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, message: PASSWORD_POLICY_MESSAGES.minLength, code: 'WEAK_PASSWORD' };
  }
  if (!/[a-z]/.test(value)) {
    return { ok: false, message: PASSWORD_POLICY_MESSAGES.lowercase, code: 'WEAK_PASSWORD' };
  }
  if (!/[A-Z]/.test(value)) {
    return { ok: false, message: PASSWORD_POLICY_MESSAGES.uppercase, code: 'WEAK_PASSWORD' };
  }
  if (!/\d/.test(value)) {
    return { ok: false, message: PASSWORD_POLICY_MESSAGES.digit, code: 'WEAK_PASSWORD' };
  }
  return { ok: true };
}

function assertStrongPassword(password) {
  const result = validatePasswordPolicy(password);
  if (!result.ok) {
    throw new AppError(result.message, 400, { code: result.code });
  }
}

module.exports = {
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_MESSAGES,
  validatePasswordPolicy,
  assertStrongPassword,
};
