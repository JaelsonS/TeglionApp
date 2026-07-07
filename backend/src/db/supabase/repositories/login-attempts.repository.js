const { getSupabaseAdmin } = require('../client');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    accountKey: row.account_key,
    failedCount: row.failed_count || 0,
    lockedUntil: row.locked_until,
    lastAttemptAt: row.last_attempt_at,
    lastIp: row.last_ip,
  };
}

async function findByAccountKey(accountKey) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('auth_login_attempts')
    .select('*')
    .eq('account_key', accountKey)
    .maybeSingle();
  if (error) throw error;
  return mapRow(data);
}

async function checkLock(accountKey) {
  const row = await findByAccountKey(accountKey);
  if (!row?.lockedUntil) return { locked: false, retryAfterSeconds: 0 };

  const lockedUntilMs = new Date(row.lockedUntil).getTime();
  const now = Date.now();
  if (lockedUntilMs <= now) {
    return { locked: false, retryAfterSeconds: 0, staleLock: true, row };
  }

  return {
    locked: true,
    retryAfterSeconds: Math.max(1, Math.ceil((lockedUntilMs - now) / 1000)),
    row,
  };
}

async function upsertFailure(accountKey, { ip, maxFailures, lockoutMs, windowMs }) {
  const sb = getSupabaseAdmin();
  const now = new Date();
  const nowIso = now.toISOString();
  const existing = await findByAccountKey(accountKey);

  let failedCount = 1;
  if (existing?.lastAttemptAt) {
    const lastMs = new Date(existing.lastAttemptAt).getTime();
    const withinWindow = now.getTime() - lastMs <= windowMs;
    failedCount = withinWindow ? (existing.failedCount || 0) + 1 : 1;
  }

  let lockedUntil = null;
  if (failedCount >= maxFailures) {
    lockedUntil = new Date(now.getTime() + lockoutMs).toISOString();
  }

  const payload = {
    account_key: accountKey,
    failed_count: failedCount,
    locked_until: lockedUntil,
    last_attempt_at: nowIso,
    last_ip: ip || null,
    updated_at: nowIso,
  };

  if (existing?.id) {
    const { data, error } = await sb
      .from('auth_login_attempts')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  }

  const { data, error } = await sb.from('auth_login_attempts').insert(payload).select().single();
  if (error) throw error;
  return mapRow(data);
}

async function clearAttempts(accountKey) {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from('auth_login_attempts').delete().eq('account_key', accountKey);
  if (error) throw error;
}

module.exports = {
  checkLock,
  upsertFailure,
  clearAttempts,
};
