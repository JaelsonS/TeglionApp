const { AppError } = require('../middlewares/error.middleware');
const { readActorClientId, readActorFirmId } = require('./session-user');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readSessionFirmId(req) {
  return readActorFirmId(req.user);
}

function readSessionClientId(req) {
  return readActorClientId(req.user);
}

function requireUserFirmId(req) {
  const firmId = readSessionFirmId(req);
  if (!firmId) {
    throw new AppError('firmId ausente na sessão', 403, { code: 'FIRM_REQUIRED' });
  }
  return String(firmId);
}

function parseEntityId(value, label = 'id') {
  const s = String(value || '').trim();
  if (!s) {
    throw new AppError(`${label} inválido`, 400, { code: 'INVALID_ID' });
  }
  if (UUID_RE.test(s)) return s;
  throw new AppError(`${label} inválido`, 400, { code: 'INVALID_ID' });
}

function parseClientIdFromRequest(source, label = 'clientId') {
  const raw = source?.clientId;
  if (!raw) return undefined;
  return parseEntityId(raw, label);
}

module.exports = {
  readSessionFirmId,
  readSessionClientId,
  requireUserFirmId,
  parseEntityId,
  parseClientIdFromRequest,
};
