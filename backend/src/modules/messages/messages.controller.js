const messagesService = require('./messages.service');
const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');

exports.listThreads = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const threads = await messagesService.listThreads({ firmId });
    return res.json({ threads });
  } catch (err) {
    return next(err);
  }
};

exports.unreadSummary = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const summary = await messagesService.getUnreadSummary({ firmId });
    return res.json(summary);
  } catch (err) {
    return next(err);
  }
};

exports.listByClient = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const clientId = parseEntityId(req.params.clientId, 'clientId');
    const data = await messagesService.listMessages({ firmId, clientId });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

exports.send = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const clientId = parseEntityId(req.body.clientId || req.params.clientId, 'clientId');
    const result = await messagesService.sendFirmMessage({
      firmId,
      clientId,
      senderId: req.user?.id,
      body: req.body?.body,
      obligationId: req.body?.obligationId,
      periodMonth: req.body?.periodMonth,
      isDocumentRequest:
        req.body?.isDocumentRequest === true ||
        req.body?.isDocumentRequest === 'true',
      quickReplyKey: req.body?.quickReplyKey,
      file: req.file,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.edit = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const clientId = parseEntityId(req.body.clientId || req.params.clientId, 'clientId');
    const messageId = parseEntityId(req.params.messageId, 'messageId');
    const result = await messagesService.editFirmMessage({
      firmId,
      clientId,
      senderId: req.user?.id,
      messageId,
      body: req.body?.body,
    });
    return res.json({ message: result });
  } catch (err) {
    return next(err);
  }
};

exports.notifyCritical = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await messagesService.notifyCriticalObligations({
      firmId,
      actorId: req.user?.id,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.convertToDocumentRequest = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const messageId = parseEntityId(req.params.messageId, 'messageId');
    const result = await messagesService.convertToDocumentRequest({
      firmId,
      messageId,
      actorId: req.user?.id,
      obligationId: req.body?.obligationId,
      periodMonth: req.body?.periodMonth,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.notifyInactive = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await messagesService.notifyInactiveClients({
      firmId,
      actorId: req.user?.id,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
