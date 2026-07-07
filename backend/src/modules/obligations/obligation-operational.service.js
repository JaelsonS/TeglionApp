const { getRepository } = require('../../db/supabase/repositories');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const { classifyObligationLane } = require('./obligation-operational');
const firmObligations = require('./firm-obligations.service');
const templatesService = require('./obligation-templates.service');
const { getSupabaseAdmin } = require('../../db/supabase/client');
const { nextPeriodFromFrequency, dueDateForPeriod } = require('./obligation-operational');
const { AppError } = require('../../middlewares/error.middleware');

async function listObligationsOperational({
  firmId,
  clientId,
  period,
  lane,
  limit = 200,
  includeExcluded = false,
}) {
  const repo = getRepository();
  const monthExclusionsService = require('./task-month-exclusions.service');
  let items = await repo.listObligationsEnriched({ firmId, clientId, period, limit });

  const months = monthExclusionsService.collectMonthsFromItems(items, period);
  const exclusions = await monthExclusionsService.listExclusionsForFirm({
    firmId,
    clientId,
    months,
  });

  const withLane = items.map((ob) => ({
    ...ob,
    operationalLane: classifyObligationLane(ob),
  }));

  let filtered = monthExclusionsService.applyExclusionsToObligations(withLane, exclusions, {
    includeExcluded,
  });

  if (lane) {
    filtered = filtered.filter((o) => o.operationalLane === lane);
  }
  return { items: filtered, monthExclusions: exclusions };
}

async function getOperationalDashboard(firmId) {
  const repo = getRepository();
  await repo.syncOverdueObligations(firmId);
  const items = await repo.listObligationsEnriched({ firmId, limit: 500 });
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const lanes = { critical: [], upcoming: [], overdue: [], waiting_client: [], completed: [] };
  const byAssignee = new Map();
  const clientsAtRisk = new Map();

  for (const ob of items) {
    const lane = classifyObligationLane(ob, now);
    lanes[lane].push({ ...ob, operationalLane: lane });

    if (lane === 'overdue' || lane === 'critical') {
      clientsAtRisk.set(ob.clientId, (clientsAtRisk.get(ob.clientId) || 0) + 1);
    }

    const staffId = ob.assignedStaffId || 'unassigned';
    if (!byAssignee.has(staffId)) {
      byAssignee.set(staffId, { staffId, total: 0, critical: 0, overdue: 0 });
    }
    const bucket = byAssignee.get(staffId);
    bucket.total += 1;
    if (lane === 'critical') bucket.critical += 1;
    if (lane === 'overdue') bucket.overdue += 1;
  }

  const dueToday = items.filter((o) => {
    const d = String(o.dueDate || '').slice(0, 10);
    return d === todayStr && !['DELIVERED', 'CANCELLED'].includes(o.status);
  });

  const staff = await firmUsersRepository.listFirmUsers(firmId).catch(() => []);
  const staffNameById = new Map(staff.map((s) => [s.id, s.fullName || s.email]));

  return {
    metrics: {
      total: items.length,
      critical: lanes.critical.length,
      upcoming: lanes.upcoming.length,
      overdue: lanes.overdue.length,
      waitingClient: lanes.waiting_client.length,
      completed: lanes.completed.length,
      dueToday: dueToday.length,
      clientsAtRisk: clientsAtRisk.size,
    },
    dueToday: dueToday.slice(0, 12),
    critical: lanes.critical.slice(0, 12),
    upcoming: lanes.upcoming.slice(0, 12),
    overdue: lanes.overdue.slice(0, 12),
    waitingClient: lanes.waiting_client.slice(0, 12),
    assignees: Array.from(byAssignee.values()).map((a) => ({
      ...a,
      staffName: a.staffId === 'unassigned' ? 'Sem responsável' : staffNameById.get(a.staffId) || 'Equipa',
    })),
    clientsAtRiskList: Array.from(clientsAtRisk.entries())
      .slice(0, 10)
      .map(([clientId, count]) => ({ clientId, count })),
  };
}

async function createFromTemplate({
  firmId,
  templateId,
  clientId,
  period,
  dueDate,
  assignedStaffId,
  amountCents,
  notes,
  accountantNotes,
  createdByUserId,
  createClientTask,
  priority,
}) {
  const sb = getSupabaseAdmin();
  const { data: tpl, error } = await sb
    .from('obligation_templates')
    .select('*')
    .eq('id', templateId)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  if (!tpl) throw new AppError('Modelo não encontrado', 404);

  const usePeriod = period || require('./obligation-operational').currentPeriodLabel(tpl.recurrence_frequency);
  const useDue =
    dueDate || dueDateForPeriod(usePeriod, tpl.default_due_day);

  return firmObligations.createObligationWithTask({
    firmId: firmId,
    clientId: clientId,
    type: tpl.type,
    period: usePeriod,
    dueDate: useDue,
    title: tpl.name,
    notes,
    accountantNotes: accountantNotes || tpl.default_task_description,
    amountCents: amountCents ?? tpl.default_amount_cents,
    priority: priority || tpl.default_priority,
    assignedStaffId,
    createdByUserId,
    createClientTask: createClientTask ?? tpl.create_client_task,
    templateId: tpl.id,
    checklist: tpl.checklist,
    expectedDocuments: tpl.expected_documents,
    skipClientNotify: false,
  });
}

async function generateNextFromRule({ firmId, ruleId, createdByUserId }) {
  const sb = getSupabaseAdmin();
  const { data: rule, error } = await sb
    .from('obligation_recurrence_rules')
    .select('*, obligation_templates(*)')
    .eq('id', ruleId)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  if (!rule || !rule.is_active) throw new AppError('Regra de recorrência não encontrada', 404);

  const tpl = rule.obligation_templates;
  const period = rule.next_period || nextPeriodFromFrequency(rule.frequency, rule.last_period);
  const due = rule.next_due_date || dueDateForPeriod(period, tpl?.default_due_day);

  const result = await createFromTemplate({
    firmId,
    templateId: rule.template_id,
    clientId: rule.client_id,
    period,
    dueDate: due,
    assignedStaffId: rule.assigned_staff_id,
    createdByUserId,
  });

  const nextP = nextPeriodFromFrequency(rule.frequency, period);
  const nextD = dueDateForPeriod(nextP, tpl?.default_due_day);
  await sb
    .from('obligation_recurrence_rules')
    .update({
      last_period: period,
      next_period: nextP,
      next_due_date: nextD,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ruleId);

  if (result.obligation?.id) {
    await sb
      .from('obligations')
      .update({ recurrence_rule_id: ruleId })
      .eq('id', result.obligation.id);
  }

  return result;
}

module.exports = {
  listObligationsOperational,
  getOperationalDashboard,
  createFromTemplate,
  generateNextFromRule,
};
