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
    const { parseLegalPublishAcknowledgement } = require('./public-site-legal-compliance');
    const legalPublishAcknowledgement = parseLegalPublishAcknowledgement(req.body);
    const data = await firmPublicSiteService.publishSite(firmId, String(req.user.id), {
      actor: req.user,
      legalPublishAcknowledgement,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
    });
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
    const sectionKey = req.body?.sectionKey ? String(req.body.sectionKey) : undefined;
    const data = await firmPublicSiteService.uploadImage(firmId, String(req.user.id), {
      slot,
      sectionKey,
      file: req.file,
    });
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.uploadPublicLogo = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    if (!req.file) throw new AppError('Selecione uma imagem (JPG, PNG ou WebP).', 400);
    const zone = String(req.params?.zone || req.body?.zone || 'shared');
    const data = await firmPublicSiteService.uploadPublicLogo(firmId, String(req.user.id), req.file, zone);
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.removePublicLogo = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const zone = String(req.params?.zone || req.query?.zone || 'shared');
    const data = await firmPublicSiteService.removePublicLogo(firmId, String(req.user.id), zone);
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.resetSite = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await firmPublicSiteService.resetPublicSite(firmId, String(req.user.id));
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.uploadCatalogServiceImage = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    if (!req.file) throw new AppError('Selecione uma imagem (JPG, PNG ou WebP).', 400);
    const data = await firmPublicSiteService.uploadCatalogServiceImage(firmId, String(req.user.id), req.file);
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.patchCatalogService = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const serviceId = String(req.params.serviceId || '').trim();
    if (!serviceId) throw new AppError('Serviço inválido.', 400);
    const data = await firmPublicSiteService.patchCatalogServiceFromPublicEditor(
      firmId,
      String(req.user.id),
      serviceId,
      req.body,
    );
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};
