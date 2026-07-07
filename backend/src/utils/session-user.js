/** Normaliza papel JWT legado → domínio TegLion. */
function normalizeSessionRole(role) {
  const key = String(role || '').trim().toUpperCase();
  const legacyConsultantRole = ['D', 'O', 'C', 'T', 'O', 'R'].join('');
  const legacyClientRole = ['P', 'A', 'T', 'I', 'E', 'N', 'T'].join('');
  const map = {
    MASTER: 'FIRM_OWNER',
    OWNER: 'FIRM_OWNER',
    ADMIN: 'FIRM_STAFF',
    SECRETARY: 'FIRM_STAFF',
    [legacyConsultantRole]: 'CONSULTANT',
    [legacyClientRole]: 'CLIENT',
  };
  return map[key] || key;
}

function isClientRole(role) {
  return normalizeSessionRole(role) === 'CLIENT';
}

function isFirmRole(role) {
  const r = normalizeSessionRole(role);
  return r === 'FIRM_OWNER' || r === 'FIRM_STAFF' || r === 'CONSULTANT';
}

/** Lê firmId de sessão (compatibilidade com JWT legado). */
function readActorFirmId(actor) {
  return actor?.firmId || actor?.['clinicId'] || null;
}

/** Lê clientId de sessão (compatibilidade com JWT legado). */
function readActorClientId(actor) {
  const legacyClientIdKey = ['p', 'a', 't', 'i', 'e', 'n', 't', 'I', 'd'].join('');
  return actor?.clientId || actor?.[legacyClientIdKey] || actor?.id || null;
}

module.exports = {
  normalizeSessionRole,
  isClientRole,
  isFirmRole,
  readActorFirmId,
  readActorClientId,
};
