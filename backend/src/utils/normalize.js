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
  SAFE_NORMALIZE_EMAIL_OPTIONS,
  normalizeStringOrNull,
};
