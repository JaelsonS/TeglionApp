const { ensureClient } = require('./shared');
const { mapTaskRow } = require('./mappers');

/**
 * IDs de tarefa vinculadas a um cliente via client_task_client_links (fonte de verdade
 * -- inclui tarefas com vários clientes, não só o ponteiro legado client_tasks.client_id).
 */
async function listTaskIdsLinkedToClient(sb, firmId, clientId) {
  const { data, error } = await sb
    .from('client_task_client_links')
    .select('client_task_id')
    .eq('firm_id', firmId)
    .eq('client_id', clientId);
  if (error) throw error;
  return [...new Set((data || []).map((r) => r.client_task_id))];
}

async function listClientTasks({ firmId, clientId, statusIn }) {
  const sb = ensureClient();
  let q = sb.from('client_tasks').select('*').eq('firm_id', firmId).order('due_date', { ascending: true });
  if (clientId) {
    const taskIds = await listTaskIdsLinkedToClient(sb, firmId, clientId);
    if (!taskIds.length) return [];
    q = q.in('id', taskIds);
  }
  q = q.neq('task_type', 'internal_task');
  if (statusIn?.length) q = q.in('status', statusIn);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapTaskRow);
}

async function findClientTaskById(id, firmId, clientId) {
  const sb = ensureClient();
  if (clientId) {
    const taskIds = await listTaskIdsLinkedToClient(sb, firmId, clientId);
    if (!taskIds.includes(id)) return null;
  }
  const { data, error } = await sb
    .from('client_tasks')
    .select('*')
    .eq('id', id)
    .eq('firm_id', firmId)
    .neq('task_type', 'internal_task')
    .maybeSingle();
  if (error) throw error;
  return mapTaskRow(data);
}

async function createClientTask(data) {
  const sb = ensureClient();
  const row = {
    firm_id: data.firmId,
    client_id: data.clientId,
    obligation_id: data.obligationId || null,
    title: data.title,
    description: data.description || null,
    status: data.status || 'OPEN',
    due_date: data.dueDate || null,
    created_by: data.createdByUserId || null,
  };
  const { data: inserted, error } = await sb.from('client_tasks').insert(row).select().single();
  if (error) throw error;

  // M2M: fiche/portal usam client_task_client_links como fonte de verdade.
  if (data.clientId) {
    const { error: linkError } = await sb.from('client_task_client_links').insert({
      client_task_id: inserted.id,
      client_id: data.clientId,
      firm_id: data.firmId,
    });
    if (linkError) throw linkError;
  }

  return { ...mapTaskRow(inserted), clientIds: data.clientId ? [data.clientId] : [] };
}

async function updateClientTask(id, firmId, patch) {
  const { normalizeStatus } = require('../../../../modules/tasks/task.constants');
  const sb = ensureClient();
  const row = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) row.status = normalizeStatus(patch.status);
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.priority !== undefined) row.priority = patch.priority;
  if (patch.helpRequestedAt !== undefined) row.help_requested_at = patch.helpRequestedAt;
  if (patch.submittedAt) row.submitted_at = patch.submittedAt;
  if (patch.completedAt) row.completed_at = patch.completedAt;
  const { data, error } = await sb
    .from('client_tasks')
    .update(row)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return mapTaskRow(data);
}

module.exports = {
  listClientTasks,
  findClientTaskById,
  createClientTask,
  updateClientTask,
};
