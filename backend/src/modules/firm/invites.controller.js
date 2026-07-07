const invitesService = require('./invites.service');
const { requireUserFirmId, parseEntityId, parseClientIdFromRequest } = require('../../utils/contabil-scope');
const { AppError } = require('../../middlewares/error.middleware');

exports.create = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const { email } = req.body || {};
    const clientId = parseClientIdFromRequest(req.body);
    if (!clientId && !email) {
      throw new AppError('Indique o cliente (clientId) ou o e-mail', 400);
    }
    const result = await invitesService.createClientInvite({
      firmId: firmId,
      clientId: clientId,
      email: email ? String(email).trim() : null,
      createdByUserId: req.user?.id || null,
    });
    return res.status(201).json(result);
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
