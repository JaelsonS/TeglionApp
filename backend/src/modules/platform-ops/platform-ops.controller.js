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
      environment: platformOpsService.resolveOpsEnvironmentLabel(),
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
      status: req.query.status,
    });
    await auditPlatformOpsView(req, 'platform_ops.firms_list', {
      q: req.query.q || null,
      status: req.query.status || null,
      limit: req.query.limit || null,
    });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

exports.firmDetail = async (req, res, next) => {
  try {
    const data = await platformOpsService.getFirmDetail(req.params.firmId);
    await auditPlatformOpsView(req, 'platform_ops.firm_detail', { firmId: req.params.firmId });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

exports.suspendFirm = async (req, res, next) => {
  try {
    const data = await platformOpsService.suspendFirm(req.params.firmId, {
      actorId: req.platformOps?.userId,
      ip: req.platformOps?.ip,
    });
    return res.json({ ok: true, ...data });
  } catch (err) {
    return next(err);
  }
};

exports.reactivateFirm = async (req, res, next) => {
  try {
    const data = await platformOpsService.reactivateFirm(req.params.firmId, {
      actorId: req.platformOps?.userId,
      ip: req.platformOps?.ip,
    });
    return res.json({ ok: true, ...data });
  } catch (err) {
    return next(err);
  }
};

exports.extendFirmTrial = async (req, res, next) => {
  try {
    const data = await platformOpsService.extendFirmTrial(req.params.firmId, {
      days: req.body?.days,
      trialEndsAt: req.body?.trialEndsAt,
      actorId: req.platformOps?.userId,
      ip: req.platformOps?.ip,
    });
    return res.json({ ok: true, ...data });
  } catch (err) {
    return next(err);
  }
};

exports.cancelFirm = async (req, res, next) => {
  try {
    const data = await platformOpsService.cancelFirm(req.params.firmId, {
      confirmName: req.body?.confirmName,
      actorId: req.platformOps?.userId,
      ip: req.platformOps?.ip,
    });
    return res.json({ ok: true, ...data });
  } catch (err) {
    return next(err);
  }
};

exports.sentryIssues = async (req, res, next) => {
  try {
    const sentryOps = require('./sentry-ops.service');
    const data = await sentryOps.listRecentIssues({ limit: req.query.limit });
    await auditPlatformOpsView(req, 'platform_ops.sentry_view');
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

exports.listIpDenylist = async (req, res, next) => {
  try {
    const ipDenylist = require('./ip-denylist.service');
    const includeRevoked =
      req.query.includeRevoked === '1' ||
      req.query.includeRevoked === 'true' ||
      req.query.includeRevoked === true;
    const data = await ipDenylist.listDenylist({
      limit: req.query.limit,
      offset: req.query.offset,
      includeRevoked,
    });
    await auditPlatformOpsView(req, 'platform_ops.ip_denylist_list', { includeRevoked });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

exports.addIpDenylist = async (req, res, next) => {
  try {
    const ipDenylist = require('./ip-denylist.service');
    const data = await ipDenylist.addIp(req.body?.ip, {
      reason: req.body?.reason,
      actorId: req.platformOps?.userId,
      actorIp: req.platformOps?.ip,
    });
    return res.json({ ok: true, ...data });
  } catch (err) {
    return next(err);
  }
};

exports.revokeIpDenylist = async (req, res, next) => {
  try {
    const ipDenylist = require('./ip-denylist.service');
    const key = req.body?.id || req.body?.ip || req.params?.id;
    const data = await ipDenylist.revokeIp(key, {
      actorId: req.platformOps?.userId,
      actorIp: req.platformOps?.ip,
    });
    return res.json({ ok: true, ...data });
  } catch (err) {
    return next(err);
  }
};

exports.securityLabSignals = async (req, res, next) => {
  try {
    const securityLab = require('./security-lab.service');
    const items = await securityLab.listRecentSignals({ hours: 24 });
    await auditPlatformOpsView(req, 'platform_ops.security_lab_view');
    return res.json({ items, stagingOnly: true });
  } catch (err) {
    return next(err);
  }
};

exports.securityLabEmit = async (req, res, next) => {
  try {
    const securityLab = require('./security-lab.service');
    const data = await securityLab.emitSignal({
      code: req.body?.code,
      note: req.body?.note,
      actorId: req.platformOps?.userId,
      ip: req.platformOps?.ip,
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
    const lockedOnly =
      req.query.lockedOnly === '1' ||
      req.query.lockedOnly === 'true' ||
      req.query.lockedOnly === true;
    const data = await platformOpsService.listLoginAttempts({
      limit: req.query.limit,
      offset: req.query.offset,
      lockedOnly,
    });
    await auditPlatformOpsView(req, 'platform_ops.login_attempts_list', { lockedOnly });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

exports.clearLockout = async (req, res, next) => {
  try {
    const data = await platformOpsService.clearLoginLockout(req.body?.accountKey, {
      actorId: req.platformOps?.userId,
      ip: req.platformOps?.ip,
    });
    return res.json({ ok: true, ...data });
  } catch (err) {
    return next(err);
  }
};

exports.exportCsv = async (req, res, next) => {
  try {
    const file = await platformOpsService.exportCsv(req.params.kind, {
      q: req.query.q,
      status: req.query.status,
      action: req.query.action,
      firmId: req.query.firmId,
      since: req.query.since,
      lockedOnly: req.query.lockedOnly,
    });
    await auditPlatformOpsView(req, 'platform_ops.export', { kind: req.params.kind });
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    return res.send(file.body);
  } catch (err) {
    return next(err);
  }
};
