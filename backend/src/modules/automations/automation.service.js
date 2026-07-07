const { getSupabaseAdmin } = require('../../db/supabase/client');
const automationRepo = require('./automation.repository');
const tasksRepo = require('../../db/supabase/repositories/tasks.repository');
const tasksWorkspace = require('../tasks/tasks-workspace.service');

async function runAutomationsForFirm(firmId) {
  const sb = getSupabaseAdmin();
  const rules = (await automationRepo.listRules(firmId)).filter((r) => r.enabled);
  const today = new Date().toISOString().slice(0, 10);
  const summary = { rulesRun: 0, tasksCreated: 0, notifications: 0 };

  for (const rule of rules) {
    summary.rulesRun += 1;
    const cfg = rule.config || {};

    if (rule.triggerType === 'OBLIGATION_DUE' && rule.actionType === 'CREATE_TASK') {
      const daysBefore = Number(cfg.daysBefore) || 7;
      const target = new Date();
      target.setDate(target.getDate() + daysBefore);
      const targetStr = target.toISOString().slice(0, 10);

      const { data: obligations, error } = await sb
        .from('obligations')
        .select('id, client_id, title, type, due_date, status')
        .eq('firm_id', firmId)
        .eq('due_date', targetStr)
        .in('status', ['PENDING', 'IN_PROGRESS', 'WAITING_CLIENT']);
      if (error) throw error;

      for (const ob of obligations || []) {
        const title = `Preparar ${ob.title || ob.type} — vence ${ob.due_date}`;
        const { data: existing } = await sb
          .from('client_tasks')
          .select('id')
          .eq('firm_id', firmId)
          .eq('obligation_id', ob.id)
          .neq('status', 'ARCHIVED')
          .limit(1);
        if (existing?.length) continue;

        await tasksRepo.insertTask({
          firm_id: firmId,
          client_id: ob.client_id,
          obligation_id: ob.id,
          title,
          description: `Tarefa automática: obrigação com prazo em ${daysBefore} dias.`,
          status: 'TODO',
          priority: cfg.priority || 'NORMAL',
          due_date: ob.due_date,
        });
        summary.tasksCreated += 1;
      }
    }

    if (rule.triggerType === 'TASK_OVERDUE' && rule.actionType === 'NOTIFY_STAFF') {
      const { data: overdue, error } = await sb
        .from('client_tasks')
        .select('id, title, client_id, due_date')
        .eq('firm_id', firmId)
        .lt('due_date', today)
        .not('status', 'in', '(DONE,ARCHIVED)');
      if (error) throw error;

      for (const t of overdue || []) {
        await tasksWorkspace.notifyFirmStaff({
          firmId,
          category: 'DEADLINE',
          type: 'TASK_OVERDUE',
          title: 'Tarefa em atraso',
          body: t.title,
          entityType: 'CLIENT_TASK',
          entityId: t.id,
          actionUrl: `/app/firm/tasks?task=${t.id}`,
        });
        summary.notifications += 1;
      }
    }

    if (rule.triggerType === 'TASK_OVERDUE' && rule.actionType === 'SEND_REMINDER') {
      const { data: waiting, error } = await sb
        .from('client_tasks')
        .select('id, title, client_id')
        .eq('firm_id', firmId)
        .eq('status', 'WAITING_CLIENT')
        .lt('due_date', today);
      if (error) throw error;

      for (const t of waiting || []) {
        await tasksWorkspace.notifyClientInApp({
          firmId,
          clientId: t.client_id,
          type: 'CLIENT_TASK',
          title: 'Lembrete: tarefa pendente',
          body: t.title,
          entityId: t.id,
        });
        summary.notifications += 1;
      }
    }
  }

  return summary;
}

module.exports = { runAutomationsForFirm, listRules: automationRepo.listRules, upsertRule: automationRepo.upsertRule };
