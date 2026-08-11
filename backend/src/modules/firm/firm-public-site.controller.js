const firmPublicSiteService = require('./firm-public-site.service');
const { AppError } = require('../../middlewares/error.middleware');

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

exports.uploadImage = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    if (!req.file) throw new AppError('Selecione uma imagem (JPG, PNG ou WebP).', 400);
    const slot = String(req.body?.slot || 'hero');
    const data = await firmPublicSiteService.uploadImage(firmId, String(req.user.id), { slot, file: req.file });
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
};
