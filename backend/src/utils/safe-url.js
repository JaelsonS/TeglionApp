/**
 * Validação de URLs vindas de input do utilizador antes de gravar/renderizar.
 * Rejeita esquemas executáveis (javascript:, data:, vbscript:, file:) e exige https.
 */

function isSafeHttpsUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (!parsed.hostname) return false;
    if (parsed.username || parsed.password) return false;
    return true;
  } catch {
    return false;
  }
}

function normalizeHttpsUrlOrNull(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (!/^https:\/\//i.test(trimmed)) return null;
  return isSafeHttpsUrl(trimmed) ? trimmed.slice(0, 500) : null;
}

/** Link externo: rejeita javascript:/data:; http e host nu passam a https. */
function coerceExternalHttpsUrlOrNull(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed || /[\s<>]/.test(trimmed)) return null;
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) return null;
  let candidate = trimmed;
  if (/^https:\/\//i.test(trimmed)) candidate = trimmed;
  else if (/^http:\/\//i.test(trimmed)) candidate = `https://${trimmed.slice('http://'.length)}`;
  else if (/^\/\//.test(trimmed)) candidate = `https:${trimmed}`;
  else if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(trimmed)) candidate = `https://${trimmed}`;
  else return null;
  return isSafeHttpsUrl(candidate) ? candidate.slice(0, 500) : null;
}

/**
 * Confirma que uma storage key `firm/{firmId}/...` pertence mesmo à firm que a está
 * a gravar. Sem isto, um utilizador podia apontar para o caminho de armazenamento de
 * OUTRA firm (adivinhando/obtendo o UUID) e o servidor geraria despreocupadamente uma
 * signed URL para um ficheiro que não lhe pertence (o storage usa service_role e
 * ignora RLS — a validação de posse tem de acontecer aqui, não no Storage).
 */
function isOwnFirmStorageKey(value, firmId) {
  const trimmed = String(value || '').trim();
  if (!trimmed.startsWith('firm/') || !firmId) return false;
  const owner = trimmed.split('/')[1];
  return Boolean(owner) && owner === String(firmId);
}

module.exports = {
  isSafeHttpsUrl,
  normalizeHttpsUrlOrNull,
  coerceExternalHttpsUrlOrNull,
  isOwnFirmStorageKey,
};
