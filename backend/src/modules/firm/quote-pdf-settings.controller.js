const quotePdfSettingsService = require('./quote-pdf-settings.service');
const { requireUserFirmId } = require('../../utils/contabil-scope');

exports.get = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const settings = await quotePdfSettingsService.getQuotePdfSettings(firmId);
    return res.json({ settings });
  } catch (err) {
    return next(err);
  }
};

exports.patch = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const settings = await quotePdfSettingsService.updateQuotePdfSettings(firmId, req.body || {});
    return res.json({ settings });
  } catch (err) {
    return next(err);
  }
};
