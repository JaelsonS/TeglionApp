/**
 * Remove campos sensíveis de respostas JSON (defesa em profundidade).
 * Nunca expor hashes de palavra-passe, tokens ou segredos ao cliente.
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'password_hash',
  'refreshToken',
  'refresh_token',
  'refresh_token_hash',
  'accessToken',
  'access_token',
  'token_hash',
  'secret',
  'apiKey',
  'api_key',
]);

function stripSensitiveValue(value) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(stripSensitiveValue);
  if (typeof value !== 'object') return value;

  const out = {};
  for (const [key, nested] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key)) continue;
    out[key] = stripSensitiveValue(nested);
  }
  return out;
}

function responseSanitizeMiddleware(_req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (body) => originalJson(stripSensitiveValue(body));
  next();
}

module.exports = { responseSanitizeMiddleware, stripSensitiveValue, SENSITIVE_KEYS };
