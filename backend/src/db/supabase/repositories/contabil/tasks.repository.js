const { ensureClient } = require('./shared');
const { mapTaskRow } = require('./mappers');

async function listClientTasks({ firmId, clientId, statusIn }) {
  const sb = ensureClient();
  let q = sb.from('client_tasks').select('*').eq('firm_id', firmId).order('due_date', { ascending: true });
  if (clientId) q = q.eq('client_id', clientId);
  q = q.neq('task_type', 'internal_task');
  if (statusIn?.length) q = q.in('status', statusIn);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapTaskRow);
}

async function findClientTaskById(id, firmId, clientId) {
  const sb = ensureClient();
  let q = sb.from('client_tasks').select('*').eq('id', id).eq('firm_id', firmId);
  if (clientId) q = q.eq('client_id', clientId);
  q = q.neq('task_type', 'internal_task');
  const { data, error } = await q.maybeSingle();
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
  return mapTaskRow(inserted);
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
