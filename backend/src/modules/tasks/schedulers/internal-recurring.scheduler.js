/**
 * Scheduler de tarefas internas recorrentes.
 * Cria a próxima ocorrência a partir da regra quando a ocorrência actual já venceu.
 */
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../../db/supabase/client');
const tasksRepo = require('../../../db/supabase/repositories/tasks.repository');

const MS_DAY = 24 * 60 * 60 * 1000;

const FREQUENCY_MONTHS = {
    MONTHLY: 1,
    QUARTERLY: 3,
    SEMIANNUAL: 6,
    ANNUAL: 12,
};

function startOfDay(value) {
    const date = new Date(value)
    date.setHours(0, 0, 0, 0)
    return date
}

function addMonths(baseDate, months) {
    const date = new Date(baseDate)
    const day = date.getDate()
    date.setMonth(date.getMonth() + months, 1)
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    date.setDate(Math.min(day, lastDay))
    return date
}

function periodMonthFromDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function dueDateForPeriod(periodMonth, dueDayOfMonth) {
    const [year, month] = periodMonth.split('-').map((part) => Number(part))
    const day = Math.max(1, Math.min(dueDayOfMonth || 1, 28))
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

async function processFirm(firmId) {
    const sb = getSupabaseAdmin()
    const { data: rules, error } = await sb
        .from('task_recurring_rules')
        .select('*')
        .eq('firm_id', firmId)
        .eq('is_active', true)
    if (error) throw error

    const today = startOfDay(new Date())

    for (const rule of rules || []) {
        const latest = await tasksRepo.findLatestTaskByRecurringRule(firmId, rule.id)
        if (!latest?.dueDate) continue

        const latestDue = startOfDay(latest.dueDate)
        if (latestDue > today) continue

        const months = FREQUENCY_MONTHS[String(rule.recurrence_frequency || 'MONTHLY').toUpperCase()] || 1
        const nextDue = addMonths(latestDue, months)
        const nextPeriod = periodMonthFromDate(nextDue)
        const exists = await tasksRepo.findTaskByRecurringRulePeriod(firmId, rule.id, nextPeriod)
        if (exists) continue

        await tasksRepo.insertTask({
            firm_id: firmId,
            client_id: rule.client_id,
            title: rule.title,
            description: rule.description || null,
            status: 'TODO',
            priority: latest.priority || 'NORMAL',
            due_date: dueDateForPeriod(nextPeriod, rule.due_day_of_month || Number(String(nextDue.getDate()).padStart(2, '0'))),
            assignee_id: latest.assigneeId || null,
            tags: latest.tags || [],
            recurrence_rule: { frequency: rule.recurrence_frequency || 'MONTHLY', ruleId: rule.id },
            task_type: 'internal_task',
            period_month: nextPeriod,
            recurring_rule_id: rule.id,
            created_by: latest.createdBy || null,
        })
    }
}

async function runAllFirms() {
    if (!isSupabaseConfigured()) return
    const sb = getSupabaseAdmin()
    const { data, error } = await sb.from('firms').select('id').eq('status', 'ACTIVE')
    if (error) return
    for (const row of data || []) {
        await processFirm(row.id).catch(() => { })
    }
}

module.exports = { runAllFirms, processFirm }