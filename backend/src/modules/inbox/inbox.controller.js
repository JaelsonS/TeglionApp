const inboxService = require('./inbox.service');
const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');

exports.getFirmInbox = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const clientId = req.query.clientId
      ? parseEntityId(String(req.query.clientId), 'clientId')
      : undefined;
    const requestStatus = req.query.status ? String(req.query.status).trim() : undefined;
    const data = await inboxService.getFirmInbox({
      firmId,
      clientId,
      requestStatus,
    });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};
