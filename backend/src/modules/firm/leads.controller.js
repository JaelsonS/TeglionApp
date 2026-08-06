const leadsService = require('./leads.service');
const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');

exports.list = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
    const result = await leadsService.list({ firmId, status });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getDetail = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const id = parseEntityId(req.params.id, 'id');
    const result = await leadsService.getById({ firmId, id });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await leadsService.create({ firmId, actor: req.user, payload: req.body || {} });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.patch = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const id = parseEntityId(req.params.id, 'id');
    const result = await leadsService.update({ firmId, id, actor: req.user, payload: req.body || {} });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.convertToClient = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const id = parseEntityId(req.params.id, 'id');
    const result = await leadsService.convertToClient({ firmId, id, actor: req.user });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
