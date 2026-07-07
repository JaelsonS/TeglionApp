const documentsFirmService = require('./documents-firm.service');
const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');

exports.validate = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await documentsFirmService.validateDocument({
      firmId,
      documentId: parseEntityId(req.params.id, 'id'),
      validationStatus: req.body?.validationStatus || 'APPROVED',
      validatedBy: req.user?.id,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await documentsFirmService.getDocumentDetail({
      firmId,
      documentId: parseEntityId(req.params.id, 'id'),
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.requestResend = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await documentsFirmService.requestResend({
      firmId,
      documentId: parseEntityId(req.params.id, 'id'),
      staffId: req.user?.id,
      message: req.body?.message,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await documentsFirmService.deleteDocument({
      firmId,
      documentId: parseEntityId(req.params.id, 'id'),
      deletedBy: req.user?.id,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.checkDuplicate = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await documentsFirmService.checkDuplicate({
      firmId,
      clientId: parseEntityId(req.query.clientId, 'clientId'),
      title: req.query.title,
      period: req.query.period,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
