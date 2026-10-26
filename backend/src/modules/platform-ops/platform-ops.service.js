const { AppError } = require('../../middlewares/error.middleware');
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../db/supabase/client');
const auditRepository = require('../../db/supabase/repositories/contabil/audit.repository');

function ensureSb() {
  if (!isSupabaseConfigured()) throw new AppError('Base de dados indisponível', 503);
  return getSupabaseAdmin();
}

async function getOverview() {
  const sb = ensureSb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [firmsRes, usersRes, auditRes, lockedRes] = await Promise.all([
    sb.from('firms').select('id', { count: 'exact', head: true }),
    sb.from('firm_users').select('id', { count: 'exact', head: true }).eq('is_active', true),
    sb.from('audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', since),
    sb
      .from('auth_login_attempts')
      .select('account_key', { count: 'exact', head: true })
      .not('locked_until', 'is', null)
      .gt('locked_until', new Date().toISOString()),
  ]);

  if (firmsRes.error) throw firmsRes.error;
  if (usersRes.error) throw usersRes.error;
  if (auditRes.error) throw auditRes.error;
  // login attempts pode falhar se a tabela não existir num ambiente antigo
  const lockedCount = lockedRes.error ? null : lockedRes.count;

  return {
    firmsTotal: firmsRes.count ?? 0,
    activeFirmUsers: usersRes.count ?? 0,
    auditEventsLast24h: auditRes.count ?? 0,
    lockedAccounts: lockedCount,
    generatedAt: new Date().toISOString(),
  };
}

async function listFirms({ limit = 50, offset = 0, q = '' } = {}) {
  const sb = ensureSb();
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  let query = sb
    .from('firms')
    .select('id, name, slug, created_at, subscription_status, trial_ends_at, settings', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  const term = String(q || '').trim();
  if (term) {
    query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    items: (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.created_at,
      subscriptionStatus: row.subscription_status || null,
      trialEndsAt: row.trial_ends_at || null,
      // Sem settings completos — só flags públicas mínimas
      hasPublicSite: Boolean(row.settings?.publicProfile || row.settings?.branding),
    })),
    total: count ?? null,
  };
}

async function listAuditLogs(params) {
  return auditRepository.listPlatformAuditLogs(params);
}

async function listLoginAttempts({ limit = 50, offset = 0 } = {}) {
  const sb = ensureSb();
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const { data, error, count } = await sb
    .from('auth_login_attempts')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);
  if (error) throw error;

  return {
    items: (data || []).map((row) => ({
      accountKey: row.account_key,
      failedCount: row.failed_count,
      lockedUntil: row.locked_until,
      lastAttemptAt: row.last_attempt_at,
      lastIp: row.last_ip || null,
      updatedAt: row.updated_at,
    })),
    total: count ?? null,
  };
}

module.exports = {
  getOverview,
  listFirms,
  listAuditLogs,
  listLoginAttempts,
};
