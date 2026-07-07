const documentRequestsService = require('./document-requests.service');
const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');

exports.listByClient = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const clientId = parseEntityId(req.params.clientId, 'clientId');
    const data = await documentRequestsService.listByClient({ firmId, clientId });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const clientId = parseEntityId(req.body.clientId, 'clientId');
    const result = await documentRequestsService.createRequest({
      firmId,
      clientId,
      messageId: req.body.messageId,
      obligationId: req.body.obligationId,
      periodMonth: req.body.periodMonth,
      title: req.body.title,
      instructions: req.body.instructions || req.body.body,
      createdBy: req.user?.id,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};
