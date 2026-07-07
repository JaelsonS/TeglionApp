const pushService = require('./push.service');
const { requireUserFirmId } = require('../../utils/contabil-scope');

exports.getVapidKey = async (_req, res) => {
  const key = pushService.getVapidPublicKey();
  return res.json({ publicKey: key, enabled: Boolean(key) });
};

exports.subscribeFirm = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    await pushService.saveSubscription({
      firmId,
      userRole: 'FIRM',
      userId: req.user.id,
      subscription: req.body?.subscription,
      userAgent: req.headers['user-agent'],
    });
    return res.status(201).json({ ok: true });
  } catch (err) {
    return next(err);
  }
};

exports.subscribeClient = async (req, res, next) => {
  try {
    const firmId = req.user?.firmId;
    const clientId = req.user?.clientId || req.user?.id;
    await pushService.saveSubscription({
      firmId,
      userRole: 'CLIENT',
      userId: clientId,
      subscription: req.body?.subscription,
      userAgent: req.headers['user-agent'],
    });
    return res.status(201).json({ ok: true });
  } catch (err) {
    return next(err);
  }
};
