const consultationsService = require('./consultations.service');
const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');

exports.list = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const items = await consultationsService.listConsultations({
      firmId,
      clientId: req.query.clientId ? parseEntityId(req.query.clientId, 'clientId') : undefined,
      from: req.query.from,
      to: req.query.to,
    });
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
};

exports.attentionCount = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const data = await consultationsService.getAttentionCount({ firmId });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const { clientId, title, scheduledAt, durationMinutes, notes, staffId, accountingServiceId } = req.body || {};
    const result = await consultationsService.createConsultation({
      firmId,
      clientId: parseEntityId(clientId, 'clientId'),
      staffId: staffId ? parseEntityId(staffId, 'staffId') : req.user?.id,
      title,
      scheduledAt,
      durationMinutes,
      notes,
      accountingServiceId: accountingServiceId
        ? parseEntityId(accountingServiceId, 'accountingServiceId')
        : undefined,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await consultationsService.updateConsultation({
      firmId,
      id: parseEntityId(req.params.id, 'id'),
      patch: req.body || {},
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
