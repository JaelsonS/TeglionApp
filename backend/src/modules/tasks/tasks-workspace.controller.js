const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');
const workspace = require('./tasks-workspace.service');
const clientTasksFirm = require('./client-tasks-firm.service');

exports.listWorkspace = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await workspace.listWorkspace(firmId, req.query);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getMetrics = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const metrics = await workspace.getMetrics(firmId);
    return res.json(metrics);
  } catch (err) {
    return next(err);
  }
};

exports.getDetail = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const taskId = parseEntityId(req.params.id, 'taskId');
    const result = await workspace.getTaskDetail(firmId, taskId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const body = req.body || {};
    const result = await workspace.createTask({
      firmId,
      actor: req.user,
      payload: {
        clientId: body.clientId || body.clientId,
        obligationId: body.obligationId,
        title: body.title,
        description: body.description,
        dueDate: body.dueDate,
        priority: body.priority,
        status: body.status,
        assigneeId: body.assigneeId,
        tags: body.tags,
        recurrenceRule: body.recurrenceRule,
        taskType: body.taskType,
        notifyClient: body.notifyClient === true || body.notifyClient === 'true',
      },
      file: req.file,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.patch = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const taskId = parseEntityId(req.params.id, 'taskId');
    const result = await workspace.updateTask({ firmId, taskId, actor: req.user, patch: req.body });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.archive = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const taskId = parseEntityId(req.params.id, 'taskId');
    const result = await workspace.archiveTask({ firmId, taskId, actor: req.user });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.reopen = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const taskId = parseEntityId(req.params.id, 'taskId');
    const result = await workspace.reopenTask({ firmId, taskId, actor: req.user });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.duplicate = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const taskId = parseEntityId(req.params.id, 'taskId');
    const result = await workspace.duplicateTask({ firmId, taskId, actor: req.user });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const taskId = parseEntityId(req.params.id, 'taskId');
    const result = await workspace.deleteTask({ firmId, taskId });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const taskId = parseEntityId(req.params.id, 'taskId');
    const body = String(req.body?.body || '').trim();
    if (!body) return res.status(400).json({ message: 'Comentário vazio' });
    const result = await workspace.addComment({ firmId, taskId, actor: req.user, body });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.attach = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const taskId = parseEntityId(req.params.id, 'taskId');
    const clientId = parseEntityId(req.body.clientId || req.body.clientId, 'clientId');
    const result = await clientTasksFirm.attachDocumentToTask({
      firmId,
      taskId,
      clientId,
      file: req.file,
      actorId: req.user?.id,
      actorName: req.user?.name,
      notifyClient: true,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};
