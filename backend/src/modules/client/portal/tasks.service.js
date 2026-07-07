/**
 * Operações de tarefas do portal cliente — extraído de portal.service.js.
 */
const { AppError } = require('../../../middlewares/error.middleware');
const { getRepository } = require('../../../db/supabase/repositories');
const tasksRepo = require('../../../db/supabase/repositories/tasks.repository');
const tasksWorkspace = require('../../tasks/tasks-workspace.service');
const { normalizeStatus } = require('../../tasks/task.constants');
const { requireLinkedClient } = require('./client.guard');

async function listMyTasks({ actor, status }) {
  const client = await requireLinkedClient(actor);
  const statusIn = status ? [String(status).trim()] : undefined;
  const { items } = await tasksRepo.listTasks(client.firmId, {
    clientId: client.id,
    statusIn,
    includeArchived: false,
    limit: 100,
  });
  const active = items.filter((t) => !['ARCHIVED', 'DONE'].includes(t.status));
  return { items: statusIn ? items : active.length ? active : items };
}

async function getMyTaskDetail({ actor, taskId }) {
  const client = await requireLinkedClient(actor);
  const task = await tasksRepo.findTaskById(client.firmId, taskId, client.id);
  if (!task) throw new AppError('Tarefa não encontrada', 404);
  const comments = await tasksRepo.listComments(taskId);
  return { task, comments };
}

async function submitTask({ actor, taskId, note }) {
  const client = await requireLinkedClient(actor);
  const task = await tasksRepo.findTaskById(client.firmId, taskId, client.id);
  if (!task) throw new AppError('Tarefa não encontrada', 404);
  if (task.status === 'ARCHIVED') throw new AppError('Tarefa arquivada', 409);

  const updated = await tasksRepo.updateTask(taskId, client.firmId, {
    status: 'WAITING_CLIENT',
    submittedAt: new Date().toISOString(),
  });

  if (note) {
    await tasksRepo.insertComment({
      firmId: client.firmId,
      taskId,
      authorRole: 'CLIENT',
      authorId: actor.id,
      authorName: actor.name || actor.fullName || 'Cliente',
      body: note,
    });
  }

  await tasksWorkspace.notifyFirmStaff({
    firmId: client.firmId,
    category: 'TASK',
    type: 'TASK_SUBMITTED',
    title: 'Cliente respondeu tarefa',
    body: task.title,
    entityType: 'CLIENT_TASK',
    entityId: task.id,
    actionUrl: `/app/firm/tasks?task=${task.id}`,
  });

  if (task.obligationId) {
    const ob = await getRepository().findObligationById(task.obligationId, client.firmId);
    if (ob && ['PENDING', 'WAITING_CLIENT'].includes(ob.status)) {
      await getRepository().updateObligation(ob.id, client.firmId, { status: 'IN_PROGRESS' });
    }
  }

  return { task: updated };
}

async function completeTask({ actor, taskId, note }) {
  const client = await requireLinkedClient(actor);
  const task = await tasksRepo.findTaskById(client.firmId, taskId, client.id);
  if (!task) throw new AppError('Tarefa não encontrada', 404);

  const updated = await tasksRepo.updateTask(taskId, client.firmId, {
    status: 'REVIEW',
    submittedAt: new Date().toISOString(),
  });

  if (note) {
    await tasksRepo.insertComment({
      firmId: client.firmId,
      taskId,
      authorRole: 'CLIENT',
      authorId: actor.id,
      authorName: actor.name || actor.fullName,
      body: note,
    });
  }

  await tasksWorkspace.notifyFirmStaff({
    firmId: client.firmId,
    category: 'TASK',
    type: 'TASK_COMPLETED',
    title: 'Cliente marcou tarefa como concluída',
    body: task.title,
    entityType: 'CLIENT_TASK',
    entityId: task.id,
  });

  return { task: updated };
}

async function requestTaskHelp({ actor, taskId, message }) {
  const client = await requireLinkedClient(actor);
  const task = await tasksRepo.findTaskById(client.firmId, taskId, client.id);
  if (!task) throw new AppError('Tarefa não encontrada', 404);

  const updated = await tasksRepo.updateTask(taskId, client.firmId, {
    helpRequestedAt: new Date().toISOString(),
    status: normalizeStatus(task.status) === 'DONE' ? 'TODO' : task.status,
  });

  if (message) {
    await tasksRepo.insertComment({
      firmId: client.firmId,
      taskId,
      authorRole: 'CLIENT',
      authorId: actor.id,
      authorName: actor.name || 'Cliente',
      body: `🆘 ${message}`,
    });
  }

  await tasksWorkspace.notifyFirmStaff({
    firmId: client.firmId,
    category: 'TASK',
    type: 'TASK_HELP',
    title: 'Cliente pediu ajuda',
    body: task.title,
    entityType: 'CLIENT_TASK',
    entityId: task.id,
  });

  return { task: updated };
}

async function addTaskComment({ actor, taskId, body }) {
  const client = await requireLinkedClient(actor);
  const task = await tasksRepo.findTaskById(client.firmId, taskId, client.id);
  if (!task) throw new AppError('Tarefa não encontrada', 404);
  const comment = await tasksWorkspace.addComment({
    firmId: client.firmId,
    taskId,
    actor: { id: actor.id, name: actor.name || actor.fullName },
    body,
    authorRole: 'CLIENT',
  });
  return comment;
}

module.exports = {
  listMyTasks,
  getMyTaskDetail,
  submitTask,
  completeTask,
  requestTaskHelp,
  addTaskComment,
};
