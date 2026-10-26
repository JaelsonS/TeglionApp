const feeChargesService = require('./fee-charges.service');
const { FEE_PAYMENT_METHODS, STATUS_LABELS } = require('./fee-charges.constants');

async function resolveConnectHint(req) {
  try {
    const { getConnectStatus } = require('../connect/connect-accounts.service');
    const status = await getConnectStatus(String(req.user.firmId), {
      isOwner: req.user.role === 'FIRM_OWNER',
    });
    return {
      ready: Boolean(status?.account?.readyForCharges || status?.account?.chargesEnabled),
      configured: Boolean(status?.configured),
    };
  } catch {
    return { ready: false, configured: Boolean(process.env.STRIPE_SECRET_KEY) };
  }
}

exports.meta = async (_req, res) => {
  return res.json({
    statuses: STATUS_LABELS,
    paymentMethods: FEE_PAYMENT_METHODS,
    connectOptional: true,
  });
};

exports.map = async (req, res, next) => {
  try {
    const year = Number(req.query.year || new Date().getFullYear());
    const connectStatus = await resolveConnectHint(req);
    const result = await feeChargesService.getYearMap({
      firmId: String(req.user.firmId),
      year,
      search: req.query.q || req.query.search,
      connectStatus,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.generate = async (req, res, next) => {
  try {
    const body = req.body || {};
    const result = await feeChargesService.generateCharges({
      firmId: String(req.user.firmId),
      yearMonth: body.yearMonth || body.period,
      fromYearMonth: body.fromYearMonth || body.from,
      toYearMonth: body.toYearMonth || body.to,
      clientIds: body.clientIds,
      actorId: req.user.id,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.replicate = async (req, res, next) => {
  try {
    const body = req.body || {};
    const result = await feeChargesService.replicateCharges({
      firmId: String(req.user.firmId),
      clientId: body.clientId,
      fromYearMonth: body.fromYearMonth || body.from,
      toYearMonth: body.toYearMonth || body.to,
      amountCents: body.amountCents,
      status: body.status,
      paymentMethod: body.paymentMethod,
      overwriteDrafts: body.overwriteDrafts !== false,
      actorId: req.user.id,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const body = req.body || {};
    const result = await feeChargesService.createCharge({
      firmId: String(req.user.firmId),
      clientId: String(body.clientId || ''),
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

exports.patch = async (req, res, next) => {
  try {
    const result = await feeChargesService.patchCharge({
      firmId: String(req.user.firmId),
      chargeId: String(req.params.id),
      patch: req.body || {},
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getClientBilling = async (req, res, next) => {
  try {
    const result = await feeChargesService.getClientBilling({
      firmId: String(req.user.firmId),
      clientId: String(req.params.id),
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.patchClientBilling = async (req, res, next) => {
  try {
    const result = await feeChargesService.patchClientBilling({
      firmId: String(req.user.firmId),
      clientId: String(req.params.id),
      patch: req.body || {},
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
