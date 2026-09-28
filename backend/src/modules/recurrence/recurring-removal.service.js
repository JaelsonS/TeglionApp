const { getSupabaseAdmin } = require('../../db/supabase/client');
const { getRepository } = require('../../db/supabase/repositories');
const tasksRepo = require('../../db/supabase/repositories/tasks.repository');
const taskMonthExclusionsRepo = require('../../db/supabase/repositories/task-month-exclusions.repository');
const monthExclusionsService = require('../obligations/task-month-exclusions.service');
const firmObligations = require('../obligations/firm-obligations.service');
const { nextPeriodFromFrequency } = require('../obligations/obligation-operational');
const { AppError } = require('../../middlewares/error.middleware');

function normalizeScope(raw) {
  const s = String(raw || 'occurrence').toLowerCase();
  if (s === 'series' || s === 'all' || s === 'all_future') return 'series';
  return 'occurrence';
}

function monthFromObligation(ob) {
  return String(ob.period || ob.dueDate || '').slice(0, 7);
}

function monthFromTask(task) {
  return String(task.periodMonth || task.dueDate || '').slice(0, 7);
}

async function findObligationRecurrenceRule(firmId, obligation) {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const ruleId = obligation.recurrenceRuleId || obligation.recurrence_rule_id;
  if (ruleId) {
    const { data } = await sb
      .from('obligation_recurrence_rules')
      .select('*')
      .eq('id', ruleId)
      .eq('firm_id', firmId)
      .maybeSingle();
    return data;
  }
  const templateId = obligation.templateId || obligation.template_id;
  const clientId = obligation.clientId || obligation.client_id;
  if (!templateId || !clientId) return null;
  const { data } = await sb
    .from('obligation_recurrence_rules')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('template_id', templateId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function deactivateTaskRecurringRule(firmId, ruleId) {
  const sb = getSupabaseAdmin();
  if (!sb || !ruleId) return;
  await sb
    .from('task_recurring_rules')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', ruleId)
    .eq('firm_id', firmId);
}

async function deactivateObligationRecurrenceRule(firmId, ruleId) {
  const sb = getSupabaseAdmin();
  if (!sb || !ruleId) return;
  await sb
    .from('obligation_recurrence_rules')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', ruleId)
    .eq('firm_id', firmId);
}

async function deleteTaskWithScope({ firmId, taskId, scope: rawScope, actorId }) {
  const scope = normalizeScope(rawScope);
  const task = await tasksRepo.findTaskById(firmId, taskId);
  if (!task) throw new AppError('Tarefa não encontrada', 404);

  const ruleId =
    task.recurringRuleId ||
    (task.recurrenceRule && typeof task.recurrenceRule === 'object' ? task.recurrenceRule.ruleId : null);

  const clientId = task.clientId || task.clientIds?.[0] || null;
  const month = monthFromTask(task);

  if (ruleId) {
    if (scope === 'series') {
      await deactivateTaskRecurringRule(firmId, ruleId);
    } else if (month && clientId) {
      await taskMonthExclusionsRepo.upsertTaskRuleExclusionSafe({
        firmId,
        clientId,
        taskRecurringRuleId: ruleId,
        month,
        createdBy: actorId,
      });
    }
  }

  await tasksRepo.deleteTask(taskId, firmId);
  return { ok: true, scope, hadRecurrence: Boolean(ruleId) };
}

async function removeObligationWithScope({ firmId, obligationId, scope: rawScope, month: rawMonth, actorId }) {
  const scope = normalizeScope(rawScope);
  const repo = getRepository();
  const ob = await repo.findObligationById(obligationId, firmId);
  if (!ob) throw new AppError('Obrigação não encontrada', 404);

  const rule = await findObligationRecurrenceRule(firmId, ob);
  const month = monthExclusionsService.normalizeMonth(rawMonth, ob.period);

  if (rule) {
    if (scope === 'series') {
      await deactivateObligationRecurrenceRule(firmId, rule.id);
    } else if (month && ob.clientId) {
      await taskMonthExclusionsRepo.upsertObligationRuleExclusionSafe({
        firmId,
        clientId: ob.clientId,
        obligationRecurrenceRuleId: rule.id,
        month,
        createdBy: actorId,
      });
      await monthExclusionsService.excludeObligationFromMonth({
        firmId,
        obligationId,
        month,
        createdByUserId: actorId,
      });
    }
  } else if (scope === 'occurrence' && month) {
    await monthExclusionsService.excludeObligationFromMonth({
      firmId,
      obligationId,
      month,
      createdByUserId: actorId,
    });
  }

  await firmObligations.updateObligation({
    firmId,
    obligationId,
    patch: { status: 'CANCELLED' },
  });

  return { ok: true, scope, hadRecurrence: Boolean(rule) };
}

/** Avança períodos excluídos (YYYY-MM) para regras de tarefas internas. */
async function nextNonExcludedTaskPeriod({ firmId, clientId, ruleId, startPeriod, frequency, maxSteps = 24 }) {
  let period = String(startPeriod || '').slice(0, 7);
  for (let i = 0; i < maxSteps; i += 1) {
    const excluded = await taskMonthExclusionsRepo.isTaskRuleMonthExcluded({
      firmId,
      clientId,
      taskRecurringRuleId: ruleId,
      month: period,
    });
    if (!excluded) return period;
    period = nextPeriodFromFrequency(frequency, period);
    if (period.length === 4) break;
  }
  return period;
}

async function isObligationPeriodSkippedByRule({ firmId, clientId, ruleId, period }) {
  return taskMonthExclusionsRepo.isObligationRuleMonthExcluded({
    firmId,
    clientId,
    obligationRecurrenceRuleId: ruleId,
    month: String(period || '').slice(0, 7),
  });
}

module.exports = {
  deleteTaskWithScope,
  removeObligationWithScope,
  deactivateTaskRecurringRule,
  deactivateObligationRecurrenceRule,
  findObligationRecurrenceRule,
  nextNonExcludedTaskPeriod,
  isObligationPeriodSkippedByRule,
  normalizeScope,
};
