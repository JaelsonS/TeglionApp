const rentalsService = require('./rentals.service');

exports.meta = async (_req, res, next) => {
  try {
    const result = await rentalsService.getMeta();
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.overview = async (req, res, next) => {
  try {
    const year = Number(req.query.year || new Date().getFullYear());
    const result = await rentalsService.listOverview({
      firmId: String(req.user.firmId),
      year,
      search: req.query.q || req.query.search,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.createProperty = async (req, res, next) => {
  try {
    const result = await rentalsService.createProperty({
      firmId: String(req.user.firmId),
      payload: req.body || {},
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.patchProperty = async (req, res, next) => {
  try {
    const result = await rentalsService.patchProperty({
      firmId: String(req.user.firmId),
      propertyId: String(req.params.id),
      patch: req.body || {},
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.createLease = async (req, res, next) => {
  try {
    const result = await rentalsService.createLease({
      firmId: String(req.user.firmId),
      propertyId: String(req.params.propertyId),
      payload: req.body || {},
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.patchLease = async (req, res, next) => {
  try {
    const result = await rentalsService.patchLease({
      firmId: String(req.user.firmId),
      leaseId: String(req.params.id),
      patch: req.body || {},
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.generateReceipts = async (req, res, next) => {
  try {
    const body = req.body || {};
    const result = await rentalsService.generateReceipts({
      firmId: String(req.user.firmId),
      yearMonth: body.yearMonth || body.period,
      leaseIds: body.leaseIds,
      actorId: req.user.id,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.createReceipt = async (req, res, next) => {
  try {
    const body = req.body || {};
    const result = await rentalsService.createReceipt({
      firmId: String(req.user.firmId),
      leaseId: String(body.leaseId || ''),
      yearMonth: body.yearMonth || body.period,
      amountCents: body.amountCents,
      status: body.status,
      dueDate: body.dueDate,
      actorId: req.user.id,
    });
    return res.status(result.created ? 201 : 200).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.patchReceipt = async (req, res, next) => {
  try {
    const result = await rentalsService.patchReceipt({
      firmId: String(req.user.firmId),
      receiptId: String(req.params.id),
      patch: req.body || {},
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
