const { ensureClient } = require('./shared');
const { syncOverdueObligations } = require('./obligations.repository');
const {
  buildClientLookups,
  enrichObligations,
  partitionOpenObligations,
  computePortfolioHealth,
} = require('./firm-dashboard.stats');
const ttlCache = require('../../../../utils/cache/ttl-cache');

const ACTIVE_TASK_STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEW'];
const OBLIGATION_OPEN_FIELDS = 'id, client_id, status, due_date, period, title, type';
const OVERDUE_SYNC_TTL_SEC = 300;
const DASHBOARD_CACHE_TTL_SEC = 45;

async function maybeSyncOverdue(firmId) {
  const key = `overdue-sync:${firmId}`;
  const seen = await ttlCache.get(key);
  if (seen) return;
  await syncOverdueObligations(firmId);
  await ttlCache.set(key, '1', OVERDUE_SYNC_TTL_SEC);
}

async function loadFirmDashboardStats(firmId) {
  const sb = ensureClient();
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const inactiveSince = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekStartDate = weekStart.toISOString().slice(0, 10);
  const weekEndDate = weekEnd.toISOString().slice(0, 10);
  const todayStartIso = weekStart.toISOString();
  const monthStartIso = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  await maybeSyncOverdue(firmId);

  const [
    clientsRes,
    obligationsOpenRes,
    obligationsTotalRes,
    obligationsDeliveredRes,
    obligationsPeriodRes,
    tasksAllRes,
    tasksWeekRes,
    tasksTodayRes,
    docsRes,
    pendingDocsCountRes,
    pendingDocsTodayRes,
    pendingDocsWeekRes,
    pendingDocsRes,
    inactiveRes,
    consultFutureRes,
  ] = await Promise.all([
    sb
      .from('clients')
      .select('id, display_name, tax_id, last_login_at, assigned_staff_id')
      .eq('firm_id', firmId)
      .eq('status', 'ACTIVE'),
    sb
      .from('obligations')
      .select(OBLIGATION_OPEN_FIELDS)
      .eq('firm_id', firmId)
      .not('status', 'eq', 'DELIVERED')
      .not('status', 'eq', 'CANCELLED'),
    sb.from('obligations').select('id', { count: 'exact', head: true }).eq('firm_id', firmId),
    sb
      .from('obligations')
      .select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)
      .eq('status', 'DELIVERED'),
    sb
      .from('obligations')
      .select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)
      .eq('period', period),
    sb
      .from('client_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)
      .in('status', ACTIVE_TASK_STATUSES),
    sb
      .from('client_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)
      .in('status', ACTIVE_TASK_STATUSES)
      .gte('due_date', weekStartDate)
      .lte('due_date', weekEndDate),
    sb
      .from('client_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)
      .in('status', ACTIVE_TASK_STATUSES)
      .eq('due_date', weekStartDate),
    sb
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)
      .eq('is_active', true)
      .gte('created_at', monthStartIso),
    sb
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)
      .eq('is_active', true)
      .eq('validation_status', 'PENDING')
      .eq('uploaded_by_role', 'CLIENT'),
    sb
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)
      .eq('is_active', true)
      .eq('validation_status', 'PENDING')
      .eq('uploaded_by_role', 'CLIENT')
      .gte('created_at', todayStartIso),
    sb
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)
      .eq('is_active', true)
      .eq('validation_status', 'PENDING')
      .eq('uploaded_by_role', 'CLIENT')
      .gte('created_at', todayStartIso)
      .lte('created_at', weekEnd.toISOString()),
    sb
      .from('documents')
      .select('id, title, client_id, period, created_at, validation_status')
      .eq('firm_id', firmId)
      .eq('is_active', true)
      .eq('validation_status', 'PENDING')
      .eq('uploaded_by_role', 'CLIENT')
      .order('created_at', { ascending: false })
      .limit(12),
    sb
      .from('clients')
      .select('id, display_name, email, last_login_at')
      .eq('firm_id', firmId)
      .eq('status', 'ACTIVE')
      .or(`last_login_at.is.null,last_login_at.lt.${inactiveSince}`),
    sb
      .from('consultations')
      .select('id, client_id, title, scheduled_at, duration_minutes, status')
      .eq('firm_id', firmId)
      .eq('status', 'SCHEDULED')
      .gte('scheduled_at', now.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(14),
  ]);

  const results = [
    clientsRes,
    obligationsOpenRes,
    obligationsTotalRes,
    obligationsDeliveredRes,
    obligationsPeriodRes,
    tasksAllRes,
    tasksWeekRes,
    tasksTodayRes,
    docsRes,
    pendingDocsCountRes,
    pendingDocsTodayRes,
    pendingDocsWeekRes,
    pendingDocsRes,
    inactiveRes,
    consultFutureRes,
  ];
  for (const res of results) {
    if (res.error) throw res.error;
  }

  const clients = clientsRes.data || [];
  const { clientNameById, clientTaxById } = buildClientLookups(clients);
  const obligations = enrichObligations(obligationsOpenRes.data || [], clientNameById, clientTaxById);
  const { overdue, waitingClient, criticalNext48h } = partitionOpenObligations(obligations, now, in48h);
  const { totalClients, portfolioHealth } = computePortfolioHealth(clients, obligations, now);

  const messagesRepo = require('../messages.repository');
  const avgResponseHours = await messagesRepo.getAvgFirmResponseHours(firmId);

  return {
    period,
    totalClients,
    portfolioHealth,
    obligations: {
      total: obligationsTotalRes.count || 0,
      overdue: overdue.length,
      waitingClient: waitingClient.length,
      currentPeriod: obligationsPeriodRes.count || 0,
      delivered: obligationsDeliveredRes.count || 0,
    },
    tasksOpen: tasksAllRes.count || 0,
    tasksOpenWeek: tasksWeekRes.count || 0,
    tasksOpenToday: tasksTodayRes.count || 0,
    documentsThisMonth: docsRes.count || 0,
    recentOverdue: overdue.slice(0, 8),
    recentWaiting: waitingClient.slice(0, 8),
    criticalNext48h: criticalNext48h.slice(0, 12),
    pendingValidationDocs: (pendingDocsRes.data || []).map((d) => ({
      _id: d.id,
      title: d.title,
      clientId: d.client_id,
      clientName: clientNameById.get(d.client_id) || null,
      period: d.period,
      createdAt: d.created_at,
    })),
    pendingValidationCount: pendingDocsCountRes.count || 0,
    pendingValidationCountToday: pendingDocsTodayRes.count || 0,
    pendingValidationCountWeek: pendingDocsWeekRes.count || 0,
    inactiveClients: (inactiveRes.data || []).slice(0, 12).map((c) => ({
      id: c.id,
      displayName: c.display_name,
      email: c.email,
      lastLoginAt: c.last_login_at,
    })),
    upcomingConsultations: (consultFutureRes.data || []).map((r) => ({
      _id: r.id,
      clientId: r.client_id,
      clientName: clientNameById.get(r.client_id) || 'Cliente',
      title: r.title,
      scheduledAt: r.scheduled_at,
      durationMinutes: r.duration_minutes,
    })),
    avgResponseHours,
  };
}

async function getFirmDashboardStats(firmId) {
  return ttlCache.getOrSet(`firm-dashboard:${firmId}`, DASHBOARD_CACHE_TTL_SEC, () =>
    loadFirmDashboardStats(firmId),
  );
}

module.exports = { getFirmDashboardStats, loadFirmDashboardStats };
