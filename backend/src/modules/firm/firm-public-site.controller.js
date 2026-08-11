const firmPublicSiteService = require('./firm-public-site.service');

exports.getSite = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await firmPublicSiteService.getSite(firmId);
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.saveDraft = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await firmPublicSiteService.saveDraft(firmId, String(req.user.id), req.body);
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.publish = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await firmPublicSiteService.publishSite(firmId, String(req.user.id));
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.regeneratePreviewToken = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await firmPublicSiteService.regeneratePreviewToken(firmId, String(req.user.id));
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};
