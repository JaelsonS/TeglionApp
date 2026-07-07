const { AppError } = require('../../middlewares/error.middleware');
const { logger } = require('../../utils/logger');
const portalService = require('./portal.service');

exports.getHubSummary = async (req, res, next) => {
  try {
    const result = await portalService.getHubSummary({ actor: req.user });
    return res.json(result);
  } catch (err) {
    if (err instanceof AppError && err.statusCode && err.statusCode < 500) {
      return next(err);
    }
    logger.error('[portal.hub] unhandled', {
      message: err?.message,
      userId: req.user?.id,
      firmId: req.user?.firmId,
    });
    return res.json(
      portalService.buildMinimalHubResponse({
        firmId: req.user?.firmId,
      }),
    );
  }
};

exports.listMyObligations = async (req, res, next) => {
  try {
    const result = await portalService.listMyObligations({
      actor: req.user,
      period: req.query.period,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.listMyTasks = async (req, res, next) => {
  try {
    const result = await portalService.listMyTasks({
      actor: req.user,
      status: req.query.status,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.submitTask = async (req, res, next) => {
  try {
    const result = await portalService.submitTask({
      actor: req.user,
      taskId: req.params.id,
      note: req.body?.note,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getMyTaskDetail = async (req, res, next) => {
  try {
    const result = await portalService.getMyTaskDetail({ actor: req.user, taskId: req.params.id });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.completeTask = async (req, res, next) => {
  try {
    const result = await portalService.completeTask({
      actor: req.user,
      taskId: req.params.id,
      note: req.body?.note,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.requestTaskHelp = async (req, res, next) => {
  try {
    const result = await portalService.requestTaskHelp({
      actor: req.user,
      taskId: req.params.id,
      message: req.body?.message,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.addTaskComment = async (req, res, next) => {
  try {
    const body = String(req.body?.body || '').trim();
    if (!body) return res.status(400).json({ message: 'Comentário vazio' });
    const result = await portalService.addTaskComment({ actor: req.user, taskId: req.params.id, body });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    const fromArray = req.files?.files || [];
    const fromSingle = req.files?.file || (req.file ? [req.file] : []);
    const files = [...fromArray, ...fromSingle];
    if (files.length > 1) {
      const result = await portalService.uploadClientDocumentsBatch({
        actor: req.user,
        files,
        obligationId: req.body?.obligationId,
        clientTaskId: req.body?.clientTaskId,
        period: req.body?.period,
        title: req.body?.title,
        description: req.body?.description,
        observations: req.body?.observations,
        category: req.body?.category,
        tags: req.body?.tags,
      });
      return res.status(201).json(result);
    }
    const result = await portalService.uploadClientDocument({
      actor: req.user,
      file: req.file || files[0],
      obligationId: req.body?.obligationId,
      clientTaskId: req.body?.clientTaskId,
      documentRequestId: req.body?.documentRequestId,
      period: req.body?.period,
      title: req.body?.title,
      description: req.body?.description,
      observations: req.body?.observations,
      category: req.body?.category,
      tags: req.body?.tags,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.markObligationPaid = async (req, res, next) => {
  try {
    const result = await portalService.markObligationPaid({
      actor: req.user,
      obligationId: req.params.id,
      paymentProofFile: req.file,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.listNotifications = async (req, res, next) => {
  try {
    const result = await portalService.listMyNotifications({ actor: req.user });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const result = await portalService.markNotificationRead({
      actor: req.user,
      notificationId: req.params.id,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await portalService.markAllNotificationsRead({ actor: req.user });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getClientDashboard = async (req, res, next) => {
  try {
    const result = await portalService.getClientDashboard({ actor: req.user });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.listMyDocumentRequests = async (req, res, next) => {
  try {
    const result = await portalService.listMyDocumentRequests({ actor: req.user });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.markMyDocumentRequestSeen = async (req, res, next) => {
  try {
    const result = await portalService.markMyDocumentRequestSeen({
      actor: req.user,
      requestId: req.params.id,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.listMyDocuments = async (req, res, next) => {
  try {
    const result = await portalService.listMyDocuments({
      actor: req.user,
      validationStatus: req.query.validationStatus || req.query.status,
      period: req.query.period,
      limit: req.query.limit,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.listMyMessages = async (req, res, next) => {
  try {
    const result = await portalService.listMyMessages({ actor: req.user });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getMyMessagesUnreadCount = async (req, res, next) => {
  try {
    const result = await portalService.getMyMessagesUnreadCount({ actor: req.user });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.sendMyMessage = async (req, res, next) => {
  try {
    const result = await portalService.sendMyMessage({
      actor: req.user,
      body: req.body?.body,
      obligationId: req.body?.obligationId,
      quickReplyKey: req.body?.quickReplyKey,
      file: req.file,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.editMyMessage = async (req, res, next) => {
  try {
    const result = await portalService.editMyMessage({
      actor: req.user,
      messageId: req.params.id,
      body: req.body?.body,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.listBookingServices = async (req, res, next) => {
  try {
    const result = await portalService.listBookingServicesForClient({ actor: req.user });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.listBookingSlots = async (req, res, next) => {
  try {
    const result = await portalService.listBookingSlotsForClient({
      actor: req.user,
      serviceId: req.query.serviceId,
      from: req.query.from,
      to: req.query.to,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.bookConsultation = async (req, res, next) => {
  try {
    const result = await portalService.bookConsultationAsClient({
      actor: req.user,
      serviceId: req.body?.serviceId,
      scheduledAt: req.body?.scheduledAt,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.deliverObligation = async (req, res, next) => {
  try {
    const result = await portalService.deliverObligation({
      actor: req.user,
      obligationId: req.params.id,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
