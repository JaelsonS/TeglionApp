const { requireUserFirmId } = require('../../utils/contabil-scope');
const { AppError } = require('../../middlewares/error.middleware');
const caeHistoryService = require('./cae-history.service');

exports.list = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await caeHistoryService.listCaeHistory({ firmId });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.remember = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const cae = req.body?.cae != null ? String(req.body.cae) : '';
    if (!cae.trim()) throw new AppError('CAE obrigatório', 400);
    const result = await caeHistoryService.rememberCae({ firmId, cae });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
