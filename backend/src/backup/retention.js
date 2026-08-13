/**
 * Política de retenção de dumps diários no R2.
 *
 * - diários: manter últimos N dias
 * - semanal: manter N domingos (UTC)
 * - mensal: manter N backups do dia 1 (UTC)
 *
 * Só apaga após sucesso do backup novo (orquestrador garante).
 */

const { parseDumpKeyTimestamp } = require('./naming');

function startOfUtcDay(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * @param {Array<{key: string, size?: number, lastModified?: Date|null}>} objects
 * @param {{ dailyDays: number, weeklyCount: number, monthlyCount: number }} policy
 * @param {Date} [now]
 * @returns {{ keep: string[], delete: string[], plan: object }}
 */
function planRetention(objects, policy, now = new Date()) {
  const dailyDays = Number(policy.dailyDays ?? 14);
  const weeklyCount = Number(policy.weeklyCount ?? 8);
  const monthlyCount = Number(policy.monthlyCount ?? 12);

  const parsed = [];
  for (const obj of objects || []) {
    const ts = parseDumpKeyTimestamp(obj.key) || (obj.lastModified ? new Date(obj.lastModified) : null);
    if (!ts || Number.isNaN(ts.getTime())) continue;
    parsed.push({ key: obj.key, date: ts });
  }

  // newest first
  parsed.sort((a, b) => b.date.getTime() - a.date.getTime());

  const keep = new Set();
  const nowDay = startOfUtcDay(now);
  const dailyCutoff = nowDay - dailyDays * 24 * 60 * 60 * 1000;

  for (const item of parsed) {
    if (startOfUtcDay(item.date) >= dailyCutoff) {
      keep.add(item.key);
    }
  }

  const sundays = parsed.filter((item) => item.date.getUTCDay() === 0);
  for (const item of sundays.slice(0, weeklyCount)) {
    keep.add(item.key);
  }

  const firstOfMonth = parsed.filter((item) => item.date.getUTCDate() === 1);
  // unique by YYYY-MM
  const seenMonths = new Set();
  let monthlyKept = 0;
  for (const item of firstOfMonth) {
    const ym = `${item.date.getUTCFullYear()}-${item.date.getUTCMonth() + 1}`;
    if (seenMonths.has(ym)) continue;
    seenMonths.add(ym);
    keep.add(item.key);
    monthlyKept += 1;
    if (monthlyKept >= monthlyCount) break;
  }

  const deleteKeys = parsed.map((p) => p.key).filter((k) => !keep.has(k));

  return {
    keep: [...keep],
    delete: deleteKeys,
    plan: {
      dailyDays,
      weeklyCount,
      monthlyCount,
      considered: parsed.length,
      keepCount: keep.size,
      deleteCount: deleteKeys.length,
    },
  };
}

function manifestKeyForDumpKey(dumpKey) {
  const m = String(dumpKey || '').match(
    /^postgresql\/daily\/(\d{4})\/(\d{2})\/(\d{4}-\d{2}-\d{2}-\d{6})\.dump$/,
  );
  if (!m) return null;
  return `postgresql/manifests/${m[1]}/${m[2]}/${m[3]}.json`;
}

module.exports = {
  planRetention,
  manifestKeyForDumpKey,
  startOfUtcDay,
};
