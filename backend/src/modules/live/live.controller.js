const { requireUserFirmId } = require('../../utils/contabil-scope');
const liveService = require('./live.service');

exports.pollFirm = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await liveService.pollFirmEvents({
      firmId,
      firmUserId: req.user?.id,
      since: req.query.since,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.pollClient = async (req, res, next) => {
  try {
    const actor = req.user;
    const firmId = actor?.firmId;
    const clientId = actor?.clientId || actor?.id;
    if (!firmId || !clientId) return res.status(401).json({ message: 'Não autenticado' });
    const result = await liveService.pollClientEvents({
      firmId,
      clientId,
      since: req.query.since,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
