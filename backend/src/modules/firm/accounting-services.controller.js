const accountingServicesService = require('./accounting-services.service');
const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');

exports.list = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const activeOnly = String(req.query.activeOnly || '').toLowerCase() === 'true';
    const result = await accountingServicesService.list({ firmId, activeOnly });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getCatalogTemplate = async (_req, res, next) => {
  try {
    return res.json({ items: accountingServicesService.getCatalogTemplate() });
  } catch (err) {
    return next(err);
  }
};

exports.seedCatalog = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await accountingServicesService.seedCatalog({ firmId });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.activateFromCatalog = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await accountingServicesService.activateFromCatalog({
      firmId,
      catalogKeys: req.body?.catalogKeys,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await accountingServicesService.create({ firmId, payload: req.body || {} });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.patch = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const id = parseEntityId(req.params.id, 'id');
    const result = await accountingServicesService.update({ firmId, id, payload: req.body || {} });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.bulkPatch = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await accountingServicesService.bulkPatch({
      firmId,
      ids: req.body?.ids,
      patch: req.body?.patch || {},
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
