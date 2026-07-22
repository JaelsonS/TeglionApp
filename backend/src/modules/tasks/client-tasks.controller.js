const { getRepository } = require('../../db/supabase/repositories');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const contabilNotifications = require('../../services/notifications/contabil-notifications.service');
const clientPortalNotify = require('../../services/notifications/client-portal-notify.service');
const clientTasksFirm = require('./client-tasks-firm.service');
const { requireUserFirmId, parseEntityId, parseClientIdFromRequest } = require('../../utils/contabil-scope');
const { AppError } = require('../../middlewares/error.middleware');

exports.list = async (req, res, next) => {
  try {
    const clientId = parseClientIdFromRequest(req.query);
    const { status } = req.query;
    const statusIn = status ? [String(status).trim()] : undefined;
    const items = await getRepository().listClientTasks({
      firmId: requireUserFirmId(req),
      clientId,
      statusIn,
    });
    return res.json({ items, total: items.length, page: 1, limit: items.length });
  } catch (err) {
    return next(err);
  }
};

function parseTaskCreateBody(req) {
  const body = req.body || {};
  const clientId = body.clientId ?? body.clientId ?? body.client_id;
  const title = body.title != null ? String(body.title).trim() : '';
  const obligationId = body.obligationId ?? body.obligation_id;
  const description = body.description != null ? String(body.description).trim() : null;
  const dueDate = body.dueDate ?? body.due_date;
  const period = body.period;
  return { clientId, title, obligationId, description, dueDate, period };
}

exports.create = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const { clientId, obligationId, title, description, dueDate, period } = parseTaskCreateBody(req);
    if (!clientId || !title) {
      throw new AppError('Selecione o cliente e indique o título da tarefa.', 400, {
        code: 'VALIDATION_ERROR',
        details: { clientId: Boolean(clientId), title: Boolean(title) },
      });
    }
    const parsedClientId = parseEntityId(clientId, 'clientId');
    const client = await clientsRepository.findClientById(firmId, parsedClientId);
    if (!client) throw new AppError('Cliente não encontrado', 404);

    const parsedObligationId = obligationId ? parseEntityId(obligationId, 'obligationId') : null;
    const task = await getRepository().createClientTask({
      firmId,
      clientId: parsedClientId,
      obligationId: parsedObligationId,
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      taskType: 'manual_task',
      createdByUserId: req.user?.id || null,
    });

    let attachment = null;
    if (req.file) {
      attachment = await clientTasksFirm.attachDocumentToTask({
        firmId: firmId,
        taskId: task.id,
        clientId: parsedClientId,
        obligationId: parsedObligationId,
        file: req.file,
        actorId: req.user?.id,
        actorName: req.user?.name || req.user?.fullName || 'Escritório',
        period: period ? String(period).trim() : null,
        notifyClient: false,
      });
    }

    const firm = await firmsRepository.findFirmById(firmId).catch(() => null);
    const dueLabel = dueDate ? new Date(dueDate).toLocaleDateString('pt-PT') : undefined;
    const notifyBody = attachment
      ? `${task.title} — consulte o documento anexado no portal.`
      : task.title;

    if (client.email) {
      void contabilNotifications
        .notifyClientNewTask({
          clientEmail: client.email,
          clientName: client.displayName || client.name,
          taskTitle: task.title,
          firmName: firm?.name,
          dueDate: dueLabel,
        })
        .catch(() => { });
    }
    if (client.phone) {
      const smsLogs = require('../../services/sms/sms-logs.service');
      const templateKey = attachment ? 'DOCUMENT_SENT' : 'TASK_CREATED';
      const templateVars = attachment
        ? { firmName: firm?.name }
        : { firmName: firm?.name, taskTitle: task.title, dueDate: dueLabel };
      void smsLogs
        .sendTemplatedSms({
          firmId: firmId,
          clientId: parsedClientId,
          phone: client.phone,
          templateKey,
          templateVars,
          entityType: 'CLIENT_TASK',
          entityId: task.id,
        })
        .catch(() => { });
    }

    await clientPortalNotify.notifyClientPortal({
      firmId: firmId,
      clientId: parsedClientId,
      type: 'CLIENT_TASK',
      title: attachment ? 'Nova tarefa com documento' : 'Nova tarefa no portal',
      body: notifyBody,
      entityType: 'CLIENT_TASK',
      entityId: task.id,
    });

    return res.status(201).json({ task, attachment });
  } catch (err) {
    return next(err);
  }
};
