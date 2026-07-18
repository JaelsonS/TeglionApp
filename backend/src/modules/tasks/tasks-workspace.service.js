const { AppError } = require('../../middlewares/error.middleware');
const { getRepository } = require('../../db/supabase/repositories');
const tasksRepo = require('../../db/supabase/repositories/tasks.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const activityService = require('../../services/activity/activity.service');
const clientTasksFirm = require('./client-tasks-firm.service');
const { normalizeStatus } = require('./task.constants');

async function notifyFirmStaff({ firmId, firmUserId, category, type, title, body, entityType, entityId, actionUrl }) {
  const sb = require('../../db/supabase/client').getSupabaseAdmin();
  if (!sb) return;
  await sb.from('firm_notifications').insert({
    firm_id: firmId,
    firm_user_id: firmUserId || null,
    category,
    type,
    title,
    body: body || null,
    entity_type: entityType,
    entity_id: entityId,
    action_url: actionUrl,
  });
}

function resolveDefaultClientActionUrl(entityType, type) {
  const e = String(entityType || '').toUpperCase();
  const t = String(type || '').toUpperCase();
  if (e === 'MESSAGE' || t === 'MESSAGE') return '/app/client/messages';
  if (e === 'DOCUMENT' || t.includes('DOCUMENT')) return '/app/client/documents';
  if (e === 'OBLIGATION' || t.includes('OBLIGATION')) return '/app/client/agenda';
  if (e === 'CLIENT_TASK' || t.includes('TASK') || t.includes('REQUEST')) return '/app/client/requests';
  return '/app/client';
}

async function notifyClientInApp({
  firmId,
  clientId,
  category,
  type,
  title,
  body,
  entityType,
  entityId,
  actionUrl,
}) {
  const sb = require('../../db/supabase/client').getSupabaseAdmin();
  if (!sb) return;
  const nextEntityType = entityType || 'CLIENT_TASK';
  await sb.from('in_app_notifications').insert({
    firm_id: firmId,
    client_id: clientId,
    category: category || nextEntityType || type || 'GENERAL',
    type,
    title,
    body,
    entity_type: nextEntityType,
    entity_id: entityId,
    action_url: actionUrl || resolveDefaultClientActionUrl(nextEntityType, type),
  });
}

async function createInternalRecurringRule({ firmId, clientId, title, description, frequency, dueDate }) {
  const sb = require('../../db/supabase/client').getSupabaseAdmin()
  if (!sb) return null
  const recurrenceFrequency = String(frequency || 'MONTHLY').toUpperCase()
  const dueDayOfMonth = dueDate ? Math.min(Math.max(new Date(dueDate).getDate(), 1), 28) : null
  const { data, error } = await sb
    .from('task_recurring_rules')
    .insert({
      firm_id: firmId,
      client_id: clientId,
      title,
      description: description || null,
      recurrence_frequency: recurrenceFrequency,
      due_day_of_month: dueDayOfMonth,
      is_active: true,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

function applyMetricFilter(items, metric) {
  if (!metric) return items;
  const m = String(metric).toLowerCase();
  if (m === 'active') {
    return items.filter((t) => !['DONE', 'ARCHIVED'].includes(t.status));
  }
  if (m === 'overdue') {
    return items.filter((t) => t.isOverdue);
  }
  if (m === 'critical') {
    return items.filter((t) => t.priority === 'URGENT' || t.helpRequestedAt);
  }
  if (m === 'waitingclient' || m === 'waiting_client') {
    return items.filter((t) => t.status === 'WAITING_CLIENT');
  }
  return items;
}

async function listWorkspace(firmId, query) {
  const limit = Math.min(Number(query.limit) || 100, 300);
  const offset = Number(query.offset) || 0;
  const result = await tasksRepo.listTasks(firmId, {
    clientId: query.clientId || query.clientId,
    statusIn: query.status ? [query.status] : query.statusIn,
    assigneeId: query.assigneeId,
    priority: query.priority,
    search: query.search,
    includeArchived: query.includeArchived === 'true',
    limit: query.metric ? 500 : limit,
    offset: query.metric ? 0 : offset,
  });
  let items = applyMetricFilter(result.items, query.metric);
  if (query.metric) {
    items = items.slice(0, limit);
  }

  const clientIds = [...new Set(items.map((t) => t.clientId))];
  const obligationIds = [...new Set(items.map((t) => t.obligationId).filter(Boolean))];
  const names = new Map();
  const obligationTitles = new Map();
  const repo = getRepository();

  await Promise.all([
    ...clientIds.map(async (id) => {
      const c = await clientsRepository.findClientById(firmId, id);
      if (c) names.set(id, c.displayName || c.name);
    }),
    ...obligationIds.map(async (id) => {
      const ob = await repo.findObligationById(id, firmId).catch(() => null);
      if (ob) obligationTitles.set(id, ob.title);
    }),
  ]);

  return {
    items: items.map((t) => ({
      ...t,
      clientName: names.get(t.clientId) || null,
      obligationTitle: t.obligationId ? obligationTitles.get(t.obligationId) : null,
    })),
    total: query.metric ? items.length : result.total,
    page: Math.floor(offset / limit) + 1,
    limit,
  };
}

async function getTaskDetail(firmId, taskId) {
  const task = await tasksRepo.findTaskById(firmId, taskId);
  if (!task) throw new AppError('Tarefa não encontrada', 404);
  const comments = await tasksRepo.listComments(taskId);
  const client = await clientsRepository.findClientById(firmId, task.clientId);
  const repo = getRepository();
  const sb = require('../../db/supabase/client').getSupabaseAdmin();

  const [activities, obligation, docsRes] = await Promise.all([
    activityService.listActivityForEntity({
      firmId,
      entityType: 'CLIENT_TASK',
      entityId: taskId,
      limit: 50,
    }),
    task.obligationId ? repo.findObligationById(task.obligationId, firmId).catch(() => null) : null,
    sb
      ? sb
        .from('documents')
        .select('id, title, mime_type, category, validation_status, workflow_status, created_at, uploaded_by_role, size_bytes')
        .eq('firm_id', firmId)
        .eq('client_task_id', taskId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      : { data: [] },
  ]);

  const documents = (docsRes.data || []).map((d) => ({
    id: d.id,
    _id: d.id,
    title: d.title,
    mimeType: d.mime_type,
    category: d.category,
    validationStatus: d.validation_status,
    workflowStatus: d.workflow_status,
    createdAt: d.created_at,
    uploadedByRole: d.uploaded_by_role,
    sizeBytes: d.size_bytes,
  }));

  const timeline = [
    ...activities.map((a) => ({
      id: a.id,
      kind: 'activity',
      title: a.title,
      description: a.description,
      actorRole: a.actorRole,
      actorName: a.actorName,
      createdAt: a.createdAt,
    })),
    ...comments.map((c) => ({
      id: c.id,
      kind: 'comment',
      title: c.authorRole === 'CLIENT' ? 'Comentário do cliente' : 'Comentário do escritório',
      description: c.body,
      actorRole: c.authorRole,
      actorName: c.authorName,
      createdAt: c.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    task: {
      ...task,
      clientName: client?.displayName || client?.name,
      clientEmail: client?.email,
      clientTaxId: client?.tax_id,
    },
    comments,
    timeline,
    documents,
    obligation: obligation
      ? { id: obligation.id, title: obligation.title, period: obligation.period, status: obligation.status }
      : null,
  };
}

async function createTask({ firmId, actor, payload, file }) {
  const clientId = payload.clientId || payload.clientId;
  if (!clientId || !payload.title?.trim()) throw new AppError('Cliente e título obrigatórios', 400);
  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404);
  const notifyClient = Boolean(payload.notifyClient);
  const taskType = payload.taskType || 'internal_task';
  const recurrenceRule = payload.recurrenceRule && typeof payload.recurrenceRule === 'object' ? payload.recurrenceRule : null;
  const dueDateValue = payload.dueDate || null;
  let recurringRuleId = null;
  let recurrenceRulePayload = null;

  if (taskType === 'internal_task' && recurrenceRule?.frequency) {
    try {
      const rule = await createInternalRecurringRule({
        firmId,
        clientId,
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
        frequency: recurrenceRule.frequency,
        dueDate: dueDateValue,
      });
      recurringRuleId = rule?.id || null;
      recurrenceRulePayload = {
        ...recurrenceRule,
        ruleId: recurringRuleId,
        frequency: String(rule?.recurrence_frequency || recurrenceRule.frequency || 'MONTHLY').toUpperCase(),
      };
    } catch (error) {
      // Compatibilidade para ambientes onde a migration de recorrência ainda não foi aplicada.
      console.warn('[tasks-workspace] createInternalRecurringRule falhou, a criar tarefa sem regra persistida:', error?.message);
      recurrenceRulePayload = {
        ...recurrenceRule,
        frequency: String(recurrenceRule.frequency || 'MONTHLY').toUpperCase(),
      };
    }
  }

  const baseRow = {
    firm_id: firmId,
    client_id: clientId,
    obligation_id: payload.obligationId || null,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    status: normalizeStatus(payload.status || 'TODO'),
    priority: payload.priority || 'NORMAL',
    due_date: payload.dueDate || null,
    assignee_id: payload.assigneeId || null,
    tags: payload.tags || [],
    depends_on_task_id: payload.dependsOnTaskId || null,
    recurrence_rule: recurrenceRulePayload || payload.recurrenceRule || null,
    created_by: actor?.id || null,
  };

  let task;
  try {
    task = await tasksRepo.insertTask({
      ...baseRow,
      task_type: taskType,
      period_month: dueDateValue ? String(dueDateValue).slice(0, 7) : null,
      recurring_rule_id: recurringRuleId,
    });
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    // Apenas colunas legadas (period_month/recurring_rule_id) podem estar ausentes em
    // ambientes muito antigos. `task_type` NUNCA pode ser rebaixado no fallback: fazer
    // isso faz a tarefa desaparecer da listagem, porque o workspace filtra estritamente
    // por task_type === 'internal_task' (ver FirmTasksWorkspacePage.tsx -> manualItems).
    const missingLegacyColumn =
      message.includes('period_month') || message.includes('recurring_rule_id');

    if (!missingLegacyColumn) throw error;

    console.warn(
      '[tasks-workspace] insertTask fallback: colunas period_month/recurring_rule_id ausentes no schema. Aplicar migration 20260522100000_architecture_debt_fix.sql. Detalhe:',
      error?.message,
    );

    // Fallback para schema antigo: mantém task_type correcto, apenas remove colunas novas.
    task = await tasksRepo.insertTask({
      ...baseRow,
      task_type: taskType,
    });
  }

  let attachment = null;
  if (file) {
    attachment = await clientTasksFirm.attachDocumentToTask({
      firmId,
      taskId: task.id,
      clientId,
      file,
      actorId: actor?.id,
      actorName: actor?.name || 'Escritório',
    });
  }

  void activityService.recordActivity({
    firmId,
    clientId,
    actorRole: 'FIRM',
    actorId: actor?.id,
    actorName: actor?.name,
    eventType: 'TASK_CREATED',
    entityType: 'CLIENT_TASK',
    entityId: task.id,
    title: `Tarefa criada: ${task.title}`,
  });

  if (notifyClient) {
    await notifyClientInApp({
      firmId,
      clientId,
      type: 'CLIENT_TASK',
      title: attachment ? 'Nova tarefa com documento' : 'Nova tarefa no portal',
      body: task.title,
      entityId: task.id,
    });
  }

  return { task, attachment };
}

async function updateTask({ firmId, taskId, actor, patch }) {
  const existing = await tasksRepo.findTaskById(firmId, taskId);
  if (!existing) throw new AppError('Tarefa não encontrada', 404);

  const next = { ...patch };
  if (next.status === 'DONE' && !existing.completedAt) next.completedAt = new Date().toISOString();
  if (next.status === 'ARCHIVED') next.archivedAt = new Date().toISOString();
  if (next.status === 'WAITING_CLIENT') next.submittedAt = new Date().toISOString();

  const task = await tasksRepo.updateTask(taskId, firmId, next);

  void activityService.recordActivity({
    firmId,
    clientId: task.clientId,
    actorRole: 'FIRM',
    actorId: actor?.id,
    actorName: actor?.name,
    eventType: 'TASK_UPDATED',
    entityType: 'CLIENT_TASK',
    entityId: task.id,
    title: `Tarefa atualizada: ${task.title}`,
    metadata: { status: task.status, fields: Object.keys(patch) },
  });

  if (patch.status === 'WAITING_CLIENT') {
    await notifyClientInApp({
      firmId,
      clientId: task.clientId,
      type: 'CLIENT_TASK',
      title: 'Ação necessária na tarefa',
      body: task.title,
      entityId: task.id,
    });
  }

  return { task };
}

async function archiveTask({ firmId, taskId, actor }) {
  return updateTask({ firmId, taskId, actor, patch: { status: 'ARCHIVED' } });
}

async function reopenTask({ firmId, taskId, actor }) {
  return updateTask({ firmId, taskId, actor, patch: { status: 'TODO', completedAt: null, archivedAt: null } });
}

async function duplicateTask({ firmId, taskId, actor }) {
  const src = await tasksRepo.findTaskById(firmId, taskId);
  if (!src) throw new AppError('Tarefa não encontrada', 404);
  const task = await tasksRepo.insertTask({
    firm_id: firmId,
    client_id: src.clientId,
    obligation_id: src.obligationId,
    title: `${src.title} (cópia)`,
    description: src.description,
    status: 'BACKLOG',
    priority: src.priority,
    due_date: src.dueDate,
    assignee_id: src.assigneeId,
    tags: src.tags,
    duplicated_from_id: src.id,
    created_by: actor?.id || null,
    // CRÍTICO: preservar task_type (e period_month) da tarefa de origem. Sem isto, a
    // coluna cai no DEFAULT 'manual_task' da tabela e a cópia some da listagem de
    // Tarefas Manuais, que filtra estritamente por task_type === 'internal_task'.
    task_type: src.taskType || 'internal_task',
    period_month: src.dueDate ? String(src.dueDate).slice(0, 7) : null,
  });
  return { task };
}

async function deleteTask({ firmId, taskId }) {
  const existing = await tasksRepo.findTaskById(firmId, taskId);
  if (!existing) throw new AppError('Tarefa não encontrada', 404);
  await tasksRepo.deleteTask(taskId, firmId);
  return { ok: true };
}

async function addComment({ firmId, taskId, actor, body, authorRole = 'FIRM' }) {
  const task = await tasksRepo.findTaskById(firmId, taskId);
  if (!task) throw new AppError('Tarefa não encontrada', 404);
  const comment = await tasksRepo.insertComment({
    firmId,
    taskId,
    authorRole,
    authorId: actor.id,
    authorName: actor.name || actor.fullName,
    body,
  });

  if (authorRole === 'FIRM') {
    await notifyClientInApp({
      firmId,
      clientId: task.clientId,
      type: 'CLIENT_TASK',
      title: 'Novo comentário na tarefa',
      body: task.title,
      entityId: task.id,
    });
  } else {
    await notifyFirmStaff({
      firmId,
      category: 'TASK',
      type: 'TASK_COMMENT',
      title: 'Cliente comentou tarefa',
      body: task.title,
      entityType: 'CLIENT_TASK',
      entityId: task.id,
      actionUrl: `/app/firm/tasks?task=${task.id}`,
    });
  }

  return { comment };
}

module.exports = {
  listWorkspace,
  getTaskDetail,
  getMetrics: (firmId) => tasksRepo.getMetrics(firmId),
  createTask,
  updateTask,
  archiveTask,
  reopenTask,
  duplicateTask,
  deleteTask,
  addComment,
  notifyFirmStaff,
  notifyClientInApp,
};
