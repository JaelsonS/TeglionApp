const fiscalCalculationsService = require('./fiscal-calculations.service');

exports.vatCatalog = async (_req, res) => {
  return res.json(fiscalCalculationsService.getVatCatalog());
};

exports.vatSimulate = async (req, res, next) => {
  try {
    const simulation = fiscalCalculationsService.runSimulate(req.body || {});
    return res.json({ simulation });
  } catch (err) {
    return next(err);
  }
};

exports.createVat = async (req, res, next) => {
  try {
    const result = await fiscalCalculationsService.createVatSimulation({
      firmId: String(req.user.firmId),
      actorId: req.user.id,
      body: req.body || {},
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const result = await fiscalCalculationsService.listCalculations({
      firmId: String(req.user.firmId),
      limit: Number(req.query.limit || 40),
      calcType: req.query.calcType || 'vat_net_gross',
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const result = await fiscalCalculationsService.getCalculation({
      firmId: String(req.user.firmId),
      id: String(req.params.id),
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
