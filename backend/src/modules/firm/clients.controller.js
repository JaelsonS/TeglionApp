const clientsService = require('./clients.service');
const spreadsheetService = require('./clients-spreadsheet.service');
const firmBrandingService = require('./firm-branding.service');
const securityAudit = require('../../services/audit/security-audit.service');
const activityService = require('../../services/activity/activity.service');

exports.getFirm = async (req, res, next) => {
  try {
    const data = await firmBrandingService.getFirmProfile(String(req.user.firmId));
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.uploadFirmLogo = async (req, res, next) => {
  try {
    const result = await firmBrandingService.uploadFirmLogo({
      firmId: String(req.user.firmId),
      file: req.file,
    });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.removeFirmLogo = async (req, res, next) => {
  try {
    const result = await firmBrandingService.removeFirmLogo({
      firmId: String(req.user.firmId),
    });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.validateNif = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await clientsService.validateClientNif({
      firmId,
      taxId: req.query.nif || req.query.taxId,
      excludeClientId: req.query.excludeClientId || null,
    });
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await clientsService.listClients({
      firmId,
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 50),
      includeInactive: req.query.includeInactive === '1' || req.query.includeInactive === 'true',
    });
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.exportSpreadsheet = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const template = req.query.template === '1' || req.query.template === 'true';
    const csv = template
      ? spreadsheetService.buildTemplateCsv()
      : await spreadsheetService.buildExportCsv({ firmId });
    const filename = template
      ? 'teglion-modelo-clientes.csv'
      : `teglion-clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(csv);
  } catch (err) {
    return next(err);
  }
};

exports.importSpreadsheet = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const report = await spreadsheetService.importCsv({
      firmId,
      actorId: String(req.user.id),
      currentPassword: req.body?.currentPassword,
      stepUpToken: req.body?.stepUpToken,
      rememberSession: req.body?.rememberSession === true || req.body?.rememberSession === 'true',
      totpCode: req.body?.totpCode,
      buffer: req.file?.buffer,
    });
    void securityAudit.recordFirmMutation({
      action: 'clients.csv_import',
      actor: req.user,
      firmId,
      entityType: 'clients',
      entityId: firmId,
      metadata: {
        created: report.created,
        updated: report.updated,
        skipped: report.skipped,
        errorCount: Array.isArray(report.errors) ? report.errors.length : 0,
      },
      req,
    });
    return res.status(200).json(report);
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const { displayName, name, email, phone, taxId, metadata, assignedStaffId } = req.body;
    const data = await clientsService.createClient({
      firmId,
      displayName: displayName || name,
      email,
      phone,
      taxId,
      metadata,
      assignedStaffId,
      actor: {
        id: req.user?.id,
        role: req.user?.role || 'FIRM',
        fullName: req.user?.fullName || req.user?.name,
      },
    });
    void securityAudit.recordClientMutation({
      action: 'client.create',
      actor: req.user,
      firmId,
      clientId: data?.id || data?._id,
      metadata: { email: email ? '[REDACTED]' : null },
      req,
    });
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await clientsService.getClient({ firmId, clientId: req.params.id });
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.getHub = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const clientId = req.params.id;
    const data = await clientsService.getClientHub({ firmId, clientId });
    void securityAudit.recordClientHubAccess({
      actor: req.user,
      firmId,
      clientId,
      req,
    });
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.hideActivity = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const clientId = req.params.id;
    const activityId = req.params.activityId;
    const row = await clientsService.hideClientActivity({ firmId, clientId, activityId });
    return res.status(200).json({ item: activityService.toTimelineItem(row) });
  } catch (err) {
    return next(err);
  }
};

exports.unhideActivity = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const clientId = req.params.id;
    const activityId = req.params.activityId;
    const row = await clientsService.unhideClientActivity({ firmId, clientId, activityId });
    return res.status(200).json({ item: activityService.toTimelineItem(row) });
  } catch (err) {
    return next(err);
  }
};

exports.hideAllFeedActivity = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const clientId = req.params.id;
    const data = await clientsService.hideAllClientFeedActivity({ firmId, clientId });
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.listActivityHistory = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const clientId = req.params.id;
    const data = await clientsService.listClientActivityHistory({
      firmId,
      clientId,
      filters: {
        from: req.query.from || null,
        to: req.query.to || null,
        kind: req.query.kind || null,
        q: req.query.q || null,
        hidden: req.query.hidden || 'all',
        page: req.query.page || 1,
        limit: req.query.limit || 40,
      },
    });
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.patch = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await clientsService.updateClient({
      firmId,
      clientId: req.params.id,
      patch: req.body,
      actor: {
        id: req.user?.id,
        role: req.user?.role || 'FIRM',
        fullName: req.user?.fullName || req.user?.name,
      },
    });
    void securityAudit.recordClientMutation({
      action: 'client.update',
      actor: req.user,
      firmId,
      clientId: req.params.id,
      metadata: { fields: Object.keys(req.body || {}) },
      req,
    });
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.archive = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await clientsService.archiveClient({
      firmId,
      clientId: req.params.id,
      actor: {
        id: req.user?.id,
        role: req.user?.role || 'FIRM',
        fullName: req.user?.fullName || req.user?.name,
      },
    });
    void securityAudit.recordClientMutation({
      action: 'client.archive',
      actor: req.user,
      firmId,
      clientId: req.params.id,
      req,
    });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};
