const firmSettingsService = require('./firm-settings.service');

exports.getSettings = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await firmSettingsService.getSettingsBundle(firmId, String(req.user.id));
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.patchFirm = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await firmSettingsService.updateFirmDetails(firmId, String(req.user.id), req.body);
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.patchProfile = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const profile = await firmSettingsService.updateMyProfile(firmId, String(req.user.id), req.body);
    return res.status(200).json({ profile });
  } catch (err) {
    return next(err);
  }
};

exports.closeAccount = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await firmSettingsService.closeFirmAccount(firmId, String(req.user.id), req.body, req);
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};
