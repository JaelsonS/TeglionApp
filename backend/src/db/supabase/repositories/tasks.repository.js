const { getSupabaseAdmin } = require('../client');
const { normalizeStatus } = require('../../../modules/tasks/task.constants');
const { safeDecryptText } = require('../../../utils/safe-display-text');
const { buildIlikeOrFilter } = require('../../../utils/postgrest-filter');

function mapTask(row) {
  if (!row) return null;
  const status = normalizeStatus(row.status);
  const due = row.due_date ? String(row.due_date).slice(0, 10) : null;
  const now = new Date().toISOString().slice(0, 10);
  return {
    id: row.id,
    _id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    // Preenchido por listTasks/findTaskById a partir de client_task_client_links (fonte
    // de verdade). Continua [] aqui porque mapTask trabalha linha a linha, sem join.
    clientIds: row.client_id ? [row.client_id] : [],
    obligationId: row.obligation_id,
    title: safeDecryptText(row.title),
    description: safeDecryptText(row.description),
    status,
    priority: row.priority || 'NORMAL',
    dueDate: due,
    isOverdue: due && due < now && !['DONE', 'ARCHIVED'].includes(status),
    assigneeId: row.assignee_id,
    tags: row.tags || [],
    dependsOnTaskId: row.depends_on_task_id,
    recurrenceRule: row.recurrence_rule,
    taskType: row.task_type || 'internal_task',
    periodMonth: row.period_month,
    recurringRuleId: row.recurring_rule_id,
    helpRequestedAt: row.help_requested_at,
    archivedAt: row.archived_at,
    submittedAt: row.submitted_at,
    completedAt: row.completed_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Vínculos M2M tarefa<->cliente (client_task_client_links) para um conjunto de tarefas.
 * Retorna Map<taskId, string[]> (clientIds, na ordem em que foram criados).
 */
async function listClientLinksForTaskIds(taskIds) {
  const ids = [...new Set((taskIds || []).filter(Boolean))];
  const map = new Map(ids.map((id) => [id, []]));
  if (!ids.length) return map;
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_task_client_links')
    .select('client_task_id, client_id')
    .in('client_task_id', ids)
    .order('created_at', { ascending: true });
  if (error) throw error;
  for (const row of data || []) {
    const list = map.get(row.client_task_id) || [];
    list.push(row.client_id);
    map.set(row.client_task_id, list);
  }
  return map;
}

/** IDs de tarefa vinculadas a um cliente via M2M (fonte de verdade — não usa client_id legado). */
async function listTaskIdsForClient(firmId, clientId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_task_client_links')
    .select('client_task_id')
    .eq('firm_id', firmId)
    .eq('client_id', clientId);
  if (error) throw error;
  return [...new Set((data || []).map((r) => r.client_task_id))];
}

/**
 * Substitui o conjunto de clientes vinculados a uma tarefa (delete-all + insert), e
 * sincroniza client_tasks.client_id (legado) para o primeiro cliente do novo conjunto,
 * ou NULL se a tarefa ficar sem cliente. Não há transação multi-statement via PostgREST
 * aqui -- mesma limitação já aceita em outros pontos do backend (ex.: ServicesCatalogWorkspace
 * reordenando em lote) -- por isso mantemos a ordem delete-then-insert-then-sync.
 */
async function setTaskClients(taskId, firmId, clientIds) {
  const sb = getSupabaseAdmin();
  const ids = [...new Set((clientIds || []).filter(Boolean))];

  const { error: delError } = await sb
    .from('client_task_client_links')
    .delete()
    .eq('client_task_id', taskId)
    .eq('firm_id', firmId);
  if (delError) throw delError;

  if (ids.length) {
    const { error: insError } = await sb
      .from('client_task_client_links')
      .insert(ids.map((clientId) => ({ client_task_id: taskId, client_id: clientId, firm_id: firmId })));
    if (insError) throw insError;
  }

  const { data, error } = await sb
    .from('client_tasks')
    .update({ client_id: ids[0] || null, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('firm_id', firmId)
    .select()
    .single();
  if (error) throw error;
  return { ...mapTask(data), clientIds: ids };
}

async function listTasks(firmId, { clientId, statusIn, assigneeId, priority, search, includeArchived = false, limit = 200, offset = 0 } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('client_tasks')
    .select('*', { count: 'exact' })
    .eq('firm_id', firmId)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (clientId) {
    // client_task_client_links é a fonte de verdade -- inclui tarefas com vários
    // clientes, não só o ponteiro legado client_tasks.client_id.
    const taskIds = await listTaskIdsForClient(firmId, clientId);
    if (!taskIds.length) return { items: [], total: 0 };
    q = q.in('id', taskIds);
  }
  if (assigneeId) q = q.eq('assignee_id', assigneeId);
  if (priority) q = q.eq('priority', priority);
  if (!includeArchived) q = q.neq('status', 'ARCHIVED');
  if (statusIn?.length) q = q.in('status', statusIn.map(normalizeStatus));
  if (search) {
    const orFilter = buildIlikeOrFilter(['title', 'description'], search);
    if (orFilter) q = q.or(orFilter);
  }

  const { data, error, count } = await q;
  if (error) throw error;
  const items = (data || []).map(mapTask);
  const linkMap = await listClientLinksForTaskIds(items.map((t) => t.id));
  for (const item of items) item.clientIds = linkMap.get(item.id) || item.clientIds;
  return { items, total: count || 0 };
}

async function findTaskById(firmId, taskId, clientId) {
  const sb = getSupabaseAdmin();
  let q = sb.from('client_tasks').select('*').eq('id', taskId).eq('firm_id', firmId);
  if (clientId) q = q.eq('client_id', clientId);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  const task = mapTask(data);
  if (!task) return null;
  const linkMap = await listClientLinksForTaskIds([task.id]);
  task.clientIds = linkMap.get(task.id) || task.clientIds;
  return task;
}

/**
 * @param {object} row - shape da linha client_tasks (chaves em snake_case).
 * @param {object} [opts]
 * @param {string[]} [opts.clientIds] - quando informado (mesmo vazio), passa a ser o
 *   conjunto autoritativo de clientes da tarefa, gravado em client_task_client_links,
 *   com row.client_id ajustado para o primeiro elemento antes do insert. Quando omitido,
 *   mantém o comportamento anterior: se row.client_id vier preenchido, cria também o
 *   vínculo M2M correspondente (chamadores antigos -- schedulers, automações, duplicação
 *   -- continuam funcionando sem precisar saber da tabela nova).
 */
async function insertTask(row, opts = {}) {
  const sb = getSupabaseAdmin();
  const explicitClientIds = Array.isArray(opts.clientIds)
    ? [...new Set(opts.clientIds.filter(Boolean))]
    : null;
  const insertRow = explicitClientIds ? { ...row, client_id: explicitClientIds[0] || null } : row;

  const { data, error } = await sb.from('client_tasks').insert(insertRow).select().single();
  if (error) throw error;

  const clientIds = explicitClientIds !== null ? explicitClientIds : (row.client_id ? [row.client_id] : []);
  if (clientIds.length) {
    const { error: linkError } = await sb
      .from('client_task_client_links')
      .insert(clientIds.map((clientId) => ({ client_task_id: data.id, client_id: clientId, firm_id: data.firm_id })));
    if (linkError) throw linkError;
  }

  return { ...mapTask(data), clientIds };
}

async function updateTask(taskId, firmId, patch) {
  const sb = getSupabaseAdmin();
  const row = { updated_at: new Date().toISOString() };
  const fields = {
    title: 'title',
    description: 'description',
    status: 'status',
    priority: 'priority',
    due_date: 'dueDate',
    assignee_id: 'assigneeId',
    obligation_id: 'obligationId',
    tags: 'tags',
    depends_on_task_id: 'dependsOnTaskId',
    recurrence_rule: 'recurrenceRule',
    task_type: 'taskType',
    period_month: 'periodMonth',
    recurring_rule_id: 'recurringRuleId',
    help_requested_at: 'helpRequestedAt',
    archived_at: 'archivedAt',
    submitted_at: 'submittedAt',
    completed_at: 'completedAt',
  };
  for (const [key, src] of Object.entries(fields)) {
    if (patch[src] !== undefined) {
      if (src === 'status') row[key] = normalizeStatus(patch[src]);
      else if (src === 'dueDate') row[key] = patch[src] || null;
      else row[key] = patch[src];
    }
  }

  // clientIds tem tratamento próprio (setTaskClients já grava client_id legado + M2M +
  // updated_at) -- se vier junto de outros campos, aplicamos os outros campos primeiro.
  const hasOtherFields = Object.keys(row).length > 1; // sempre tem updated_at
  if (hasOtherFields) {
    const { error } = await sb.from('client_tasks').update(row).eq('id', taskId).eq('firm_id', firmId);
    if (error) throw error;
  }

  if (patch.clientIds !== undefined) {
    return setTaskClients(taskId, firmId, patch.clientIds);
  }

  const { data, error } = await sb.from('client_tasks').select('*').eq('id', taskId).eq('firm_id', firmId).single();
  if (error) throw error;
  const task = mapTask(data);
  const linkMap = await listClientLinksForTaskIds([task.id]);
  task.clientIds = linkMap.get(task.id) || task.clientIds;
  return task;
}

async function deleteTask(taskId, firmId) {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from('client_tasks').delete().eq('id', taskId).eq('firm_id', firmId);
  if (error) throw error;
}

async function listComments(taskId, firmId) {
  if (!firmId) {
    throw new Error('listComments requer firmId para isolamento multi-tenant');
  }
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('task_comments')
    .select('*')
    .eq('client_task_id', taskId)
    .eq('firm_id', firmId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id,
    taskId: r.client_task_id,
    authorRole: r.author_role,
    authorId: r.author_id,
    authorName: r.author_name,
    body: r.body,
    createdAt: r.created_at,
  }));
}

async function insertComment({ firmId, taskId, authorRole, authorId, authorName, body }) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('task_comments')
    .insert({
      firm_id: firmId,
      client_task_id: taskId,
      author_role: authorRole,
      author_id: authorId,
      author_name: authorName,
      body: String(body).trim(),
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    authorRole: data.author_role,
    authorName: data.author_name,
    body: data.body,
    createdAt: data.created_at,
  };
}

async function getMetrics(firmId) {
  const sb = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb
    .from('client_tasks')
    .select('id, status, priority, due_date, client_id, assignee_id, help_requested_at')
    .eq('firm_id', firmId)
    .neq('status', 'ARCHIVED');
  if (error) throw error;

  const tasks = data || [];
  const active = tasks.filter((t) => !['DONE', 'ARCHIVED'].includes(normalizeStatus(t.status)));
  const overdue = active.filter((t) => t.due_date && String(t.due_date).slice(0, 10) < today);
  const critical = active.filter((t) => t.priority === 'URGENT' || t.help_requested_at);
  const waitingClient = active.filter((t) => normalizeStatus(t.status) === 'WAITING_CLIENT');

  const byStatus = {};
  for (const t of tasks) {
    const s = normalizeStatus(t.status);
    byStatus[s] = (byStatus[s] || 0) + 1;
  }

  const linkMap = await listClientLinksForTaskIds(active.map((t) => t.id));
  const byClient = {};
  const byAssignee = {};
  for (const t of active) {
    const linked = linkMap.get(t.id);
    const clientIds = linked?.length ? linked : t.client_id ? [t.client_id] : [];
    for (const clientId of clientIds) {
      byClient[clientId] = (byClient[clientId] || 0) + 1;
    }
    const key = t.assignee_id || 'unassigned';
    byAssignee[key] = (byAssignee[key] || 0) + 1;
  }

  const messagesRepository = require('./messages.repository');
  const avgClientResponseHours = await messagesRepository.getAvgFirmResponseHours(firmId);

  return {
    total: tasks.length,
    active: active.length,
    overdue: overdue.length,
    critical: critical.length,
    waitingClient: waitingClient.length,
    done: byStatus.DONE || 0,
    byStatus,
    avgClientResponseHours,
    topClients: Object.entries(byClient)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([clientId, count]) => ({ clientId, count })),
    byAssignee: Object.entries(byAssignee)
      .sort((a, b) => b[1] - a[1])
      .map(([assigneeId, count]) => ({ assigneeId, count })),
  };
}

async function findTaskByObligationPeriod(firmId, obligationId, periodMonth) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_tasks')
    .select('*')
    .eq('firm_id', firmId)
    .eq('obligation_id', obligationId)
    .eq('period_month', periodMonth)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTask(data) : null;
}

async function findOpenRecurringTaskForClientMonth(firmId, clientId, periodMonth) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_tasks')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('period_month', periodMonth)
    .eq('task_type', 'recurring_obligation')
    .in('status', ['BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEW', 'OPEN', 'SUBMITTED'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTask(data) : null;
}

async function findOpenTaskForObligation(firmId, obligationId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_tasks')
    .select('*')
    .eq('firm_id', firmId)
    .eq('obligation_id', obligationId)
    .in('status', ['BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEW', 'OPEN', 'SUBMITTED'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTask(data) : null;
}

async function findLatestTaskByRecurringRule(firmId, recurringRuleId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_tasks')
    .select('*')
    .eq('firm_id', firmId)
    .eq('recurring_rule_id', recurringRuleId)
    .order('period_month', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTask(data) : null;
}

async function findTaskByRecurringRulePeriod(firmId, recurringRuleId, periodMonth) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_tasks')
    .select('*')
    .eq('firm_id', firmId)
    .eq('recurring_rule_id', recurringRuleId)
    .eq('period_month', periodMonth)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTask(data) : null;
}

module.exports = {
  mapTask,
  listTasks,
  findTaskById,
  findTaskByObligationPeriod,
  findOpenRecurringTaskForClientMonth,
  findOpenTaskForObligation,
  findLatestTaskByRecurringRule,
  findTaskByRecurringRulePeriod,
  insertTask,
  updateTask,
  deleteTask,
  listComments,
  insertComment,
  getMetrics,
  listClientLinksForTaskIds,
  listTaskIdsForClient,
  setTaskClients,
};
