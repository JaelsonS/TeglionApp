/**
 * Naming / object keys para backups PostgreSQL no R2.
 */

function pad(n) {
  return String(n).padStart(2, '0');
}

function utcParts(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return {
    year: d.getUTCFullYear(),
    month: pad(d.getUTCMonth() + 1),
    day: pad(d.getUTCDate()),
    hour: pad(d.getUTCHours()),
    minute: pad(d.getUTCMinutes()),
    second: pad(d.getUTCSeconds()),
    iso: d.toISOString(),
    date,
  };
}

function buildBackupId(date = new Date()) {
  const p = utcParts(date);
  return `${p.year}${p.month}${p.day}T${p.hour}${p.minute}${p.second}Z`;
}

function buildDumpObjectKey(date = new Date()) {
  const p = utcParts(date);
  const stamp = `${p.year}-${p.month}-${p.day}-${p.hour}${p.minute}${p.second}`;
  return `postgresql/daily/${p.year}/${p.month}/${stamp}.dump`;
}

function buildManifestObjectKey(date = new Date()) {
  const p = utcParts(date);
  const stamp = `${p.year}-${p.month}-${p.day}-${p.hour}${p.minute}${p.second}`;
  return `postgresql/manifests/${p.year}/${p.month}/${stamp}.json`;
}

/**
 * Extrai timestamp UTC do object key daily.
 * @returns {Date|null}
 */
function parseDumpKeyTimestamp(objectKey) {
  const m = String(objectKey || '').match(
    /postgresql\/daily\/(\d{4})\/(\d{2})\/(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})(\d{2})\.dump$/,
  );
  if (!m) return null;
  const [, , , y, mo, d, h, mi, s] = m;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}.000Z`;
  const dt = new Date(iso);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

module.exports = {
  utcParts,
  buildBackupId,
  buildDumpObjectKey,
  buildManifestObjectKey,
  parseDumpKeyTimestamp,
};
