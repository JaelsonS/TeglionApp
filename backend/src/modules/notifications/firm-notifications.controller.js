const { requireUserFirmId } = require('../../utils/contabil-scope');
const firmNotifications = require('./firm-notifications.service');

exports.list = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Não autenticado' });
    const result = await firmNotifications.listForUser(firmId, userId, {
      limit: Number(req.query.limit) || 50,
      unreadOnly: req.query.unreadOnly === 'true',
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await firmNotifications.markRead(firmId, req.params.id, req.user.id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await firmNotifications.markAllRead(firmId, req.user.id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
