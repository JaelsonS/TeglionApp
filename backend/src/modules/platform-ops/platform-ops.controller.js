const platformOpsService = require('./platform-ops.service');
const { auditPlatformOpsView } = require('../../middlewares/platform-ops.middleware');
const { env } = require('../../config/env');

exports.me = async (req, res, next) => {
  try {
    await auditPlatformOpsView(req, 'platform_ops.session_check');
    return res.json({
      ok: true,
      email: req.platformOps.email,
      enabled: env.PLATFORM_OPS_ENABLED,
      environment: env.isProduction ? 'production' : process.env.NODE_ENV || 'development',
    });
  } catch (err) {
    return next(err);
  }
};

exports.overview = async (req, res, next) => {
  try {
    const data = await platformOpsService.getOverview();
    await auditPlatformOpsView(req, 'platform_ops.overview_view');
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

exports.firms = async (req, res, next) => {
  try {
    const data = await platformOpsService.listFirms({
      limit: req.query.limit,
      offset: req.query.offset,
      q: req.query.q,
    });
    await auditPlatformOpsView(req, 'platform_ops.firms_list', {
      q: req.query.q || null,
      limit: req.query.limit || null,
    });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

exports.auditLogs = async (req, res, next) => {
  try {
    const data = await platformOpsService.listAuditLogs({
      limit: req.query.limit,
      offset: req.query.offset,
      action: req.query.action || null,
      firmId: req.query.firmId || null,
      sinceIso: req.query.since || null,
    });
    await auditPlatformOpsView(req, 'platform_ops.audit_list', {
      action: req.query.action || null,
      firmId: req.query.firmId || null,
    });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

exports.loginAttempts = async (req, res, next) => {
  try {
    const data = await platformOpsService.listLoginAttempts({
      limit: req.query.limit,
      offset: req.query.offset,
    });
    await auditPlatformOpsView(req, 'platform_ops.login_attempts_list');
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};
