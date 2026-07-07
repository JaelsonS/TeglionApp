const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');
const service = require('./service-requests.service');

exports.list = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await service.listPipeline(firmId, req.query);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getDetail = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const id = parseEntityId(req.params.id, 'id');
    const result = await service.getDetail(firmId, id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await service.createFromFirm({ firmId, actor: req.user, payload: req.body });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.patch = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const id = parseEntityId(req.params.id, 'id');
    const result = await service.updateRequest({ firmId, id, actor: req.user, patch: req.body });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getQuote = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const id = parseEntityId(req.params.id, 'id');
    const result = await service.getQuotePdfPayload(firmId, id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const id = parseEntityId(req.params.id, 'id');
    const body = String(req.body?.body || '').trim();
    if (!body) return res.status(400).json({ message: 'Comentário vazio' });
    const result = await service.addComment({
      firmId,
      id,
      actor: req.user,
      body,
      isInternal: req.body?.isInternal === true,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.listMine = async (req, res, next) => {
  try {
    const actor = req.user;
    const firmId = actor.firmId;
    const clientId = actor.clientId || actor.id;
    const items = await service.listPipeline(firmId, { clientId });
    return res.json(items);
  } catch (err) {
    return next(err);
  }
};

exports.createMine = async (req, res, next) => {
  try {
    const result = await service.createFromClient({ actor: req.user, payload: req.body });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.approveQuote = async (req, res, next) => {
  try {
    const result = await service.approveQuote({ actor: req.user, id: req.params.id });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getMyQuote = async (req, res, next) => {
  try {
    const actor = req.user;
    const result = await service.getQuotePdfPayload(actor.firmId, req.params.id, actor.clientId || actor.id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
