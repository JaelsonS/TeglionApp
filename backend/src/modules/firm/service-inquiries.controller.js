const serviceInquiriesService = require('./service-inquiries.service');
const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');

exports.list = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
    const serviceId = req.query.serviceId ? String(req.query.serviceId) : undefined;
    const result = await serviceInquiriesService.list({ firmId, status, serviceId });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getDetail = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const id = parseEntityId(req.params.id, 'id');
    const result = await serviceInquiriesService.getById({ firmId, id });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await serviceInquiriesService.create({ firmId, actor: req.user, payload: req.body || {} });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.patch = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const id = parseEntityId(req.params.id, 'id');
    const result = await serviceInquiriesService.update({ firmId, id, actor: req.user, payload: req.body || {} });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
