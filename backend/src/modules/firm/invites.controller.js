const invitesService = require('./invites.service');
const { requireUserFirmId, parseEntityId, parseClientIdFromRequest } = require('../../utils/contabil-scope');
const { AppError } = require('../../middlewares/error.middleware');

exports.create = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const { email, initialPassword } = req.body || {};
    const clientId = parseClientIdFromRequest(req.body);
    if (!clientId && !email) {
      throw new AppError('Indique o cliente (clientId) ou o e-mail', 400);
    }
    const result = await invitesService.createClientInvite({
      firmId: firmId,
      clientId: clientId,
      email: email ? String(email).trim() : null,
      initialPassword: initialPassword ? String(initialPassword) : null,
      createdByUserId: req.user?.id || null,
      actor: req.user,
      req,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.createBulk = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const { clientIds, subject, bodyText } = req.body || {};
    if (!Array.isArray(clientIds) || !clientIds.length) {
      throw new AppError('Indique pelo menos um clientId', 400);
    }
    const emailOverride =
      subject || bodyText ? { subject: subject || null, bodyText: bodyText || null } : null;
    const result = await invitesService.createBulkClientInvites({
      firmId,
      clientIds,
      actor: req.user,
      req,
      emailOverride,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.previewInviteEmail = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const preview = await invitesService.buildInviteEmailPreview({
      firmId,
      clientName: req.query.clientName || req.body?.clientName || null,
    });
    return res.json(preview);
  } catch (err) {
    return next(err);
  }
};

exports.sendTestInviteEmail = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const { toEmail, subject, bodyText } = req.body || {};
    const result = await invitesService.sendTestInviteEmail({
      firmId,
      toEmail,
      subject,
      bodyText,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getAccessHistory = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const clientId = parseEntityId(req.params.id, 'clientId');
    const result = await invitesService.getClientAccessHistory({ firmId, clientId });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.revokeAccess = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const clientId = parseEntityId(req.params.id, 'clientId');
    const result = await invitesService.revokeClientAccess({ firmId, clientId, actor: req.user, req });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.resendInvite = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const clientId = parseEntityId(req.params.id, 'clientId');
    const result = await invitesService.resendClientInvite({ firmId, clientId, actor: req.user, req });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.previewPublic = async (req, res, next) => {
  try {
    const data = await invitesService.getInvitePublicPreview(req.params.token);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};
