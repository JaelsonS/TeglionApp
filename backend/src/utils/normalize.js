const validator = require('validator');

/**
 * Normalização de email para auth/lookup.
 * NÃO remove pontos do Gmail — isso quebrava contas como a.b@gmail.com
 * (validator.normalizeEmail remove dots por omissão).
 */
function normalizeEmail(email) {
  if (email === null || email === undefined) return undefined;
  const s = String(email).trim().toLowerCase();
  return s || undefined;
}

/** E-mail presente e com formato válido (para convites / login do portal). */
function isValidInviteEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return validator.isEmail(normalized);
}

/** Devolve o e-mail normalizado se for válido; caso contrário null. */
function normalizeValidInviteEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized || !validator.isEmail(normalized)) return null;
  return normalized;
}

/** Opções seguras se algum sítio ainda usar validator.normalizeEmail. */
const SAFE_NORMALIZE_EMAIL_OPTIONS = {
  gmail_remove_dots: false,
  gmail_remove_subaddress: false,
  outlookdotcom_remove_subaddress: false,
  yahoo_remove_subaddress: false,
  icloud_remove_subaddress: false,
};

function normalizeStringOrNull(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s : null;
}

module.exports = {
  normalizeEmail,
  isValidInviteEmail,
  normalizeValidInviteEmail,
  SAFE_NORMALIZE_EMAIL_OPTIONS,
  normalizeStringOrNull,
};
