const groupsService = require('./accounting-service-groups.service');
const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');

exports.list = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await groupsService.list({ firmId });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await groupsService.create({ firmId, payload: req.body || {} });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.patch = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const id = parseEntityId(req.params.id, 'id');
    const result = await groupsService.update({ firmId, id, payload: req.body || {} });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const id = parseEntityId(req.params.id, 'id');
    const result = await groupsService.remove({ firmId, id });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
