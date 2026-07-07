const viewTracking = require('../../services/tracking/view-tracking.service');
const smsLogsService = require('../../services/sms/sms-logs.service');
const { listTemplates } = require('../../services/sms/sms-templates.service');

function clientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;
}

exports.recordDocumentView = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const isClient = req.user.role === 'CLIENT';
    const result = await viewTracking.recordView({
      firmId,
      clientId: isClient ? String(req.user.clientId || req.user.id) : req.body?.clientId,
      entityType: 'DOCUMENT',
      entityId: req.params.id,
      viewerRole: isClient ? 'CLIENT' : 'FIRM',
      viewerId: req.user.id,
      viewerName: req.user.name || req.user.fullName || (isClient ? 'Cliente' : 'Escritório'),
      ipAddress: clientIp(req),
      userAgent: req.headers['user-agent'],
      sessionId: req.body?.sessionId || req.headers['x-session-id'] || null,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.recordObligationView = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const isClient = req.user.role === 'CLIENT';
    const result = await viewTracking.recordView({
      firmId,
      clientId: isClient ? String(req.user.clientId || req.user.id) : req.body?.clientId,
      entityType: 'OBLIGATION',
      entityId: req.params.id,
      viewerRole: isClient ? 'CLIENT' : 'FIRM',
      viewerId: req.user.id,
      viewerName: req.user.name || req.user.fullName || (isClient ? 'Cliente' : 'Escritório'),
      ipAddress: clientIp(req),
      userAgent: req.headers['user-agent'],
      sessionId: req.body?.sessionId || req.headers['x-session-id'] || null,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.endView = async (req, res, next) => {
  try {
    const result = await viewTracking.endView({
      viewId: req.body?.viewId,
      durationSeconds: req.body?.durationSeconds,
    });
    return res.json({ ok: true, view: result });
  } catch (err) {
    return next(err);
  }
};

exports.getDocumentViewStats = async (req, res, next) => {
  try {
    const stats = await viewTracking.getViewStats({
      firmId: String(req.user.firmId),
      entityType: 'DOCUMENT',
      entityId: req.params.id,
    });
    return res.json(stats);
  } catch (err) {
    return next(err);
  }
};

exports.getObligationViewStats = async (req, res, next) => {
  try {
    const stats = await viewTracking.getViewStats({
      firmId: String(req.user.firmId),
      entityType: 'OBLIGATION',
      entityId: req.params.id,
    });
    return res.json(stats);
  } catch (err) {
    return next(err);
  }
};

exports.listSmsLogs = async (req, res, next) => {
  try {
    const items = await smsLogsService.listSmsLogs({
      firmId: String(req.user.firmId),
      clientId: req.query.clientId,
    });
    return res.json({ items, templates: listTemplates() });
  } catch (err) {
    return next(err);
  }
};
