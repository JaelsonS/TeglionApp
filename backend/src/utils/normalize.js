function normalizeEmail(email) {
  return email ? String(email).toLowerCase() : undefined;
}

function normalizeStringOrNull(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s : null;
}

module.exports = {
  normalizeEmail,
  normalizeStringOrNull,
};