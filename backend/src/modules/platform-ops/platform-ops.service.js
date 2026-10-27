const { AppError } = require('../../middlewares/error.middleware');
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../db/supabase/client');
const auditRepository = require('../../db/supabase/repositories/contabil/audit.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const { env } = require('../../config/env');
const { isStagingFrontendUrl } = require('../../utils/cors-critical-origins');

function ensureSb() {
  if (!isSupabaseConfigured()) throw new AppError('Base de dados indisponível', 503);
  return getSupabaseAdmin();
}

function resolveOpsEnvironmentLabel() {
  if (isStagingFrontendUrl(env.FRONTEND_URL)) return 'staging';
  try {
    const host = new URL(String(env.FRONTEND_URL || '')).hostname.toLowerCase();
    if (host === 'teglion.com' || host === 'www.teglion.com' || host === 'app.teglion.com') {
      return 'production';
    }
  } catch {
    /* ignore */
  }
  return env.isProduction ? 'production' : process.env.NODE_ENV || 'development';
}

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function assertNotOpsHostFirm(firm) {
  const settings = firm?.settings || {};
  if (settings.internal_ops === true || String(firm?.slug || '') === 'afdigital-ops') {
    throw new AppError('Não é possível alterar o gabinete anfitrião do Control Center', 400, {
      code: 'PLATFORM_OPS_HOST_FIRM',
    });
  }
}

function hoursAgoIso(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function isNewFirm(createdAt, withinHours) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return t >= Date.now() - withinHours * 60 * 60 * 1000;
}

async function getOverview() {
  const sb = ensureSb();
  const since = hoursAgoIso(24);
  const since7d = hoursAgoIso(24 * 7);
  const since1h = hoursAgoIso(1);
  const trialHorizon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  const [
    firmsRes,
    usersRes,
    auditRes,
    lockedRes,
    trialsRes,
    suspendedRes,
    new24Res,
    new7dRes,
    failSpikeRes,
    authzFailRes,
    recentFirmsRes,
  ] = await Promise.all([
    sb.from('firms').select('id', { count: 'exact', head: true }),
    sb.from('firm_users').select('id', { count: 'exact', head: true }).eq('is_active', true),
    sb.from('audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', since),
    sb
      .from('auth_login_attempts')
      .select('account_key', { count: 'exact', head: true })
      .not('locked_until', 'is', null)
      .gt('locked_until', nowIso),
    sb
      .from('firms')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'TRIAL')
      .not('trial_ends_at', 'is', null)
      .lte('trial_ends_at', trialHorizon)
      .gte('trial_ends_at', nowIso),
    sb.from('firms').select('id', { count: 'exact', head: true }).eq('status', 'SUSPENDED'),
    sb.from('firms').select('id', { count: 'exact', head: true }).gte('created_at', since),
    sb.from('firms').select('id', { count: 'exact', head: true }).gte('created_at', since7d),
    sb
      .from('auth_login_attempts')
      .select('account_key, failed_count, last_ip, locked_until')
      .gte('updated_at', since1h)
      .gte('failed_count', 5)
      .limit(40),
    sb
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since)
      .or('action.ilike.%forbidden%,action.ilike.%unauthorized%,action.eq.auth.login_failed'),
    sb
      .from('firms')
      .select('id, name, slug, created_at, status')
      .gte('created_at', since7d)
      .order('created_at', { ascending: false })
      .limit(15),
  ]);

  if (firmsRes.error) throw firmsRes.error;
  if (usersRes.error) throw usersRes.error;
  if (auditRes.error) throw auditRes.error;

  const lockedCount = lockedRes.error ? null : lockedRes.count;
  const trialsExpiring7d = trialsRes.error ? null : trialsRes.count;
  const suspendedFirms = suspendedRes.error ? null : suspendedRes.count;
  const firmsNew24h = new24Res.error ? null : new24Res.count;
  const firmsNew7d = new7dRes.error ? null : new7dRes.count;
  const auditEventsLast24h = auditRes.count ?? 0;
  const authzFailures24h = authzFailRes.error ? null : authzFailRes.count;

  const anomalies = [];
  if (lockedCount != null && lockedCount > 0) {
    anomalies.push({
      code: 'LOCKOUTS',
      severity: 'high',
      message: `${lockedCount} conta(s) em lockout`,
      href: '/app/ops/logins',
    });
  }

  const spikeRows = failSpikeRes.error ? [] : failSpikeRes.data || [];
  if (spikeRows.length > 0) {
    anomalies.push({
      code: 'LOGIN_FAIL_SPIKE',
      severity: 'high',
      message: `${spikeRows.length} conta(s) com ≥5 falhas de login na última hora`,
      href: '/app/ops/logins',
    });
  }

  if (authzFailures24h != null && authzFailures24h >= 30) {
    anomalies.push({
      code: 'AUTHZ_SPIKE',
      severity: 'medium',
      message: `${authzFailures24h} eventos de authz/login falhado no audit (24h)`,
      href: '/app/ops/audit',
    });
  }

  if (auditEventsLast24h >= 200) {
    anomalies.push({
      code: 'AUDIT_SPIKE',
      severity: 'medium',
      message: `${auditEventsLast24h} eventos de audit nas últimas 24h`,
      href: '/app/ops/audit',
    });
  }

  if (firmsNew24h != null && firmsNew24h >= 5) {
    anomalies.push({
      code: 'FIRM_REGISTER_BURST',
      severity: 'high',
      message: `${firmsNew24h} gabinete(s) registado(s) nas últimas 24h`,
      href: '/app/ops/firms',
    });
  } else if (firmsNew24h != null && firmsNew24h > 0) {
    anomalies.push({
      code: 'FIRMS_NEW_24H',
      severity: 'low',
      message: `${firmsNew24h} gabinete(s) novo(s) nas últimas 24h`,
      href: '/app/ops/firms',
    });
  }

  if (trialsExpiring7d != null && trialsExpiring7d > 0) {
    anomalies.push({
      code: 'TRIALS_EXPIRING',
      severity: 'low',
      message: `${trialsExpiring7d} trial(s) a expirar em 7 dias`,
      href: '/app/ops/firms?status=TRIAL',
    });
  }
  if (suspendedFirms != null && suspendedFirms > 0) {
    anomalies.push({
      code: 'SUSPENDED_FIRMS',
      severity: 'medium',
      message: `${suspendedFirms} gabinete(s) suspenso(s)`,
      href: '/app/ops/firms?status=SUSPENDED',
    });
  }

  const recentFirms = (recentFirmsRes.error ? [] : recentFirmsRes.data || []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
    status: row.status || null,
    isNew24h: isNewFirm(row.created_at, 24),
    isNew7d: isNewFirm(row.created_at, 24 * 7),
  }));

  let ipDenylistActive = null;
  try {
    const ipDenylist = require('./ip-denylist.service');
    ipDenylistActive = await ipDenylist.activeCount();
    if (ipDenylistActive > 0) {
      anomalies.push({
        code: 'IP_DENYLIST',
        severity: 'medium',
        message: `${ipDenylistActive} IP(s) na denylist activa`,
        href: '/app/ops/denylist',
      });
    }
  } catch {
    ipDenylistActive = null;
  }

  return {
    firmsTotal: firmsRes.count ?? 0,
    activeFirmUsers: usersRes.count ?? 0,
    auditEventsLast24h,
    lockedAccounts: lockedCount,
    trialsExpiring7d,
    suspendedFirms,
    firmsNew24h,
    firmsNew7d,
    authzFailures24h,
    ipDenylistActive,
    recentFirms,
    anomalies,
    generatedAt: new Date().toISOString(),
  };
}

async function listFirms({ limit = 50, offset = 0, q = '', status = '' } = {}) {
  const sb = ensureSb();
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  let query = sb
    .from('firms')
    .select(
      'id, name, slug, created_at, status, subscription_status, trial_ends_at, settings',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  const term = String(q || '').trim();
  if (term) {
    query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
  }
  const statusFilter = String(status || '').trim().toUpperCase();
  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    items: (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.created_at,
      status: row.status || null,
      subscriptionStatus: row.subscription_status || null,
      trialEndsAt: row.trial_ends_at || null,
      hasPublicSite: Boolean(row.settings?.publicProfile || row.settings?.branding),
      internalOps: row.settings?.internal_ops === true,
      isNew24h: isNewFirm(row.created_at, 24),
      isNew7d: isNewFirm(row.created_at, 24 * 7),
    })),
    total: count ?? null,
  };
}

async function getFirmDetail(firmId) {
  const id = String(firmId || '').trim();
  if (!id) throw new AppError('firmId em falta', 400, { code: 'VALIDATION_ERROR' });

  const sb = ensureSb();
  const { data: row, error } = await sb.from('firms').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!row) throw new AppError('Gabinete não encontrado', 404, { code: 'FIRM_NOT_FOUND' });

  const [usersRes, clientsRes, audit] = await Promise.all([
    sb
      .from('firm_users')
      .select('id', { count: 'exact', head: true })
      .eq('firm_id', id)
      .eq('is_active', true),
    sb.from('clients').select('id', { count: 'exact', head: true }).eq('firm_id', id),
    auditRepository.listPlatformAuditLogs({ limit: 20, offset: 0, firmId: id }),
  ]);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status || null,
    subscriptionStatus: row.subscription_status || null,
    trialEndsAt: row.trial_ends_at || null,
    createdAt: row.created_at,
    countryCode: row.country_code || null,
    billingPlan: row.billing_plan || null,
    hasPublicSite: Boolean(row.settings?.publicProfile || row.settings?.branding),
    internalOps: row.settings?.internal_ops === true,
    counts: {
      activeFirmUsers: usersRes.error ? null : usersRes.count ?? 0,
      clients: clientsRes.error ? null : clientsRes.count ?? 0,
    },
    recentAudit: audit.items || [],
  };
}

async function suspendFirm(firmId, { actorId, ip } = {}) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Gabinete não encontrado', 404, { code: 'FIRM_NOT_FOUND' });
  assertNotOpsHostFirm(firm);
  if (firm.status === 'CANCELLED') {
    throw new AppError('Gabinete cancelado — não pode ser suspenso por esta via', 400, {
      code: 'FIRM_CANCELLED',
    });
  }
  if (firm.status === 'SUSPENDED') {
    return { id: firm.id, status: firm.status, already: true };
  }

  const updated = await firmsRepository.setFirmStatus(firmId, 'SUSPENDED');
  await auditRepository.writeAuditLog({
    firmId: null,
    actorRole: 'PLATFORM_OPS',
    actorId: actorId || null,
    action: 'platform_ops.firm.suspend',
    entityType: 'firm',
    entityId: firmId,
    metadata: { previousStatus: firm.status, slug: firm.slug },
    ipAddress: ip || null,
  });
  return { id: updated.id, status: updated.status, already: false };
}

async function reactivateFirm(firmId, { actorId, ip } = {}) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Gabinete não encontrado', 404, { code: 'FIRM_NOT_FOUND' });
  assertNotOpsHostFirm(firm);
  if (firm.status === 'CANCELLED') {
    throw new AppError('Gabinete cancelado — contacte o suporte para reactivação', 400, {
      code: 'FIRM_CANCELLED',
    });
  }
  if (firm.status !== 'SUSPENDED') {
    return { id: firm.id, status: firm.status, already: true };
  }

  const nextStatus =
    firm.trialEndsAt && new Date(firm.trialEndsAt).getTime() > Date.now() ? 'TRIAL' : 'ACTIVE';
  const updated = await firmsRepository.setFirmStatus(firmId, nextStatus);
  await auditRepository.writeAuditLog({
    firmId: null,
    actorRole: 'PLATFORM_OPS',
    actorId: actorId || null,
    action: 'platform_ops.firm.reactivate',
    entityType: 'firm',
    entityId: firmId,
    metadata: { previousStatus: 'SUSPENDED', nextStatus, slug: firm.slug },
    ipAddress: ip || null,
  });
  return { id: updated.id, status: updated.status, already: false };
}

async function extendFirmTrial(firmId, { days, trialEndsAt, actorId, ip } = {}) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Gabinete não encontrado', 404, { code: 'FIRM_NOT_FOUND' });
  assertNotOpsHostFirm(firm);
  if (firm.status === 'CANCELLED') {
    throw new AppError('Gabinete cancelado — não é possível estender trial', 400, {
      code: 'FIRM_CANCELLED',
    });
  }

  let nextEndsAt = null;
  if (trialEndsAt != null && String(trialEndsAt).trim()) {
    const parsed = new Date(String(trialEndsAt).trim());
    if (Number.isNaN(parsed.getTime())) {
      throw new AppError('trialEndsAt inválido', 400, { code: 'VALIDATION_ERROR' });
    }
    nextEndsAt = parsed.toISOString();
  } else {
    const n = Number(days);
    if (!Number.isFinite(n) || n < 1 || n > 365) {
      throw new AppError('Indique days (1–365) ou trialEndsAt', 400, { code: 'VALIDATION_ERROR' });
    }
    const base =
      firm.trialEndsAt && new Date(firm.trialEndsAt).getTime() > Date.now()
        ? new Date(firm.trialEndsAt)
        : new Date();
    base.setUTCDate(base.getUTCDate() + Math.floor(n));
    nextEndsAt = base.toISOString();
  }

  const previousTrialEndsAt = firm.trialEndsAt || null;
  const previousStatus = firm.status;
  const shouldSetTrial = firm.status === 'ACTIVE' || firm.status === 'TRIAL' || firm.status === 'SUSPENDED';
  const updated = await firmsRepository.setFirmTrial(firmId, {
    trialEndsAt: nextEndsAt,
    status: shouldSetTrial && firm.status !== 'SUSPENDED' ? 'TRIAL' : undefined,
  });

  await auditRepository.writeAuditLog({
    firmId: null,
    actorRole: 'PLATFORM_OPS',
    actorId: actorId || null,
    action: 'platform_ops.firm.extend_trial',
    entityType: 'firm',
    entityId: firmId,
    metadata: {
      slug: firm.slug,
      previousTrialEndsAt,
      trialEndsAt: nextEndsAt,
      previousStatus,
      days: days != null ? Number(days) : null,
    },
    ipAddress: ip || null,
  });

  return {
    id: updated.id,
    status: updated.status,
    trialEndsAt: updated.trialEndsAt,
  };
}

async function cancelFirm(firmId, { confirmName, actorId, ip } = {}) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Gabinete não encontrado', 404, { code: 'FIRM_NOT_FOUND' });
  assertNotOpsHostFirm(firm);

  if (firm.status === 'CANCELLED') {
    return { id: firm.id, status: firm.status, already: true };
  }

  const expected = String(firm.name || '').trim();
  const got = String(confirmName || '').trim();
  if (!got || got !== expected) {
    throw new AppError(`Escreva exactamente "${expected}" para confirmar o cancelamento.`, 400, {
      code: 'CONFIRM_NAME_MISMATCH',
    });
  }

  const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
  const authRefreshSessionsRepository = require('../../db/supabase/repositories/auth-refresh-sessions.repository');

  await firmsRepository.setFirmStatus(firmId, 'CANCELLED');
  await firmUsersRepository.deactivateAllFirmUsers(firmId);

  const team = await firmUsersRepository.listFirmUsers(firmId, { activeOnly: false });
  await Promise.all(
    (team || []).map((u) => authRefreshSessionsRepository.deleteAllForActor('firm_user', u.id)),
  );

  await auditRepository.writeAuditLog({
    firmId: null,
    actorRole: 'PLATFORM_OPS',
    actorId: actorId || null,
    action: 'platform_ops.firm.cancel',
    entityType: 'firm',
    entityId: firmId,
    metadata: {
      slug: firm.slug,
      previousStatus: firm.status,
      usersDeactivated: (team || []).length,
      sessionsRevoked: true,
    },
    ipAddress: ip || null,
  });

  return { id: firmId, status: 'CANCELLED', already: false };
}

async function listLoginAttempts({ limit = 50, offset = 0, lockedOnly = false } = {}) {
  const sb = ensureSb();
  const { resolveIpGeoMany, normalizeIp } = require('./ip-geo.service');
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  let query = sb
    .from('auth_login_attempts')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (lockedOnly) {
    query = query.not('locked_until', 'is', null).gt('locked_until', new Date().toISOString());
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = data || [];
  let geoMap = new Map();
  try {
    geoMap = await resolveIpGeoMany(rows.map((r) => r.last_ip));
  } catch {
    geoMap = new Map();
  }

  return {
    items: rows.map((row) => {
      const key = normalizeIp(row.last_ip);
      const geo = key ? geoMap.get(key) : null;
      return {
        accountKey: row.account_key,
        failedCount: row.failed_count,
        lockedUntil: row.locked_until,
        lastAttemptAt: row.last_attempt_at,
        lastIp: row.last_ip || null,
        countryCode: geo?.countryCode || null,
        countryName: geo?.countryName || null,
        updatedAt: row.updated_at,
      };
    }),
    total: count ?? null,
  };
}

async function clearLoginLockout(accountKey, { actorId, ip } = {}) {
  const key = String(accountKey || '').trim();
  if (!key) throw new AppError('accountKey em falta', 400, { code: 'VALIDATION_ERROR' });

  const sb = ensureSb();
  const { data, error } = await sb
    .from('auth_login_attempts')
    .update({
      failed_count: 0,
      locked_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq('account_key', key)
    .select('account_key, failed_count, locked_until')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new AppError('Conta não encontrada em login attempts', 404, { code: 'NOT_FOUND' });

  await auditRepository.writeAuditLog({
    firmId: null,
    actorRole: 'PLATFORM_OPS',
    actorId: actorId || null,
    action: 'platform_ops.lockout.clear',
    entityType: 'auth_login_attempts',
    entityId: null,
    metadata: { accountKey: key },
    ipAddress: ip || null,
  });

  return {
    accountKey: data.account_key,
    failedCount: data.failed_count,
    lockedUntil: data.locked_until,
  };
}

async function listAuditLogs(params) {
  return auditRepository.listPlatformAuditLogs(params);
}

async function exportCsv(kind, { q, status, action, firmId, since, lockedOnly } = {}) {
  const type = String(kind || '').trim().toLowerCase();

  if (type === 'firms') {
    const { items } = await listFirms({ limit: 100, offset: 0, q, status });
    return {
      filename: `ops-firms-${Date.now()}.csv`,
      contentType: 'text/csv; charset=utf-8',
      body: toCsv(
        ['id', 'name', 'slug', 'status', 'subscriptionStatus', 'trialEndsAt', 'createdAt'],
        items.map((f) => ({
          id: f.id,
          name: f.name,
          slug: f.slug,
          status: f.status,
          subscriptionStatus: f.subscriptionStatus,
          trialEndsAt: f.trialEndsAt,
          createdAt: f.createdAt,
        })),
      ),
    };
  }

  if (type === 'audit') {
    const { items } = await listAuditLogs({
      limit: 200,
      offset: 0,
      action: action || null,
      firmId: firmId || null,
      sinceIso: since || null,
    });
    return {
      filename: `ops-audit-${Date.now()}.csv`,
      contentType: 'text/csv; charset=utf-8',
      body: toCsv(
        ['id', 'action', 'actorRole', 'firmId', 'ipAddress', 'createdAt'],
        items.map((a) => ({
          id: a.id,
          action: a.action,
          actorRole: a.actorRole,
          firmId: a.firmId,
          ipAddress: a.ipAddress,
          createdAt: a.createdAt,
        })),
      ),
    };
  }

  if (type === 'logins') {
    const { items } = await listLoginAttempts({
      limit: 100,
      offset: 0,
      lockedOnly: lockedOnly === true || lockedOnly === 'true' || lockedOnly === '1',
    });
    return {
      filename: `ops-logins-${Date.now()}.csv`,
      contentType: 'text/csv; charset=utf-8',
      body: toCsv(
        ['accountKey', 'failedCount', 'lastIp', 'countryCode', 'lockedUntil', 'lastAttemptAt'],
        items.map((r) => ({
          accountKey: r.accountKey,
          failedCount: r.failedCount,
          lastIp: r.lastIp,
          countryCode: r.countryCode,
          lockedUntil: r.lockedUntil,
          lastAttemptAt: r.lastAttemptAt,
        })),
      ),
    };
  }

  throw new AppError('Export inválido (firms|audit|logins)', 400, { code: 'VALIDATION_ERROR' });
}

module.exports = {
  getOverview,
  listFirms,
  getFirmDetail,
  suspendFirm,
  reactivateFirm,
  extendFirmTrial,
  cancelFirm,
  listAuditLogs,
  listLoginAttempts,
  clearLoginLockout,
  exportCsv,
  resolveOpsEnvironmentLabel,
};
