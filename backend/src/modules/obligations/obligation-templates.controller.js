const templatesService = require('./obligation-templates.service');
const operationalService = require('./obligation-operational.service');
const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');

exports.listTemplates = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const items = await templatesService.listTemplates(firmId);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
};

exports.createTemplate = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const tpl = await templatesService.createTemplate(firmId, req.body || {});
    return res.status(201).json({ template: tpl });
  } catch (err) {
    return next(err);
  }
};

exports.operationalDashboard = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const dashboard = await operationalService.getOperationalDashboard(firmId);
    return res.json(dashboard);
  } catch (err) {
    return next(err);
  }
};

exports.createFromTemplate = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const body = req.body || {};
    const result = await operationalService.createFromTemplate({
      firmId,
      templateId: parseEntityId(body.templateId, 'templateId'),
      clientId: parseEntityId(body.clientId || body.clientId, 'clientId'),
      period: body.period,
      dueDate: body.dueDate,
      assignedStaffId: body.assignedStaffId ? parseEntityId(body.assignedStaffId, 'assignedStaffId') : null,
      amountCents: body.amountCents != null ? Number(body.amountCents) : null,
      notes: body.notes,
      accountantNotes: body.accountantNotes,
      createdByUserId: req.user?.id,
      createClientTask: body.createClientTask !== false,
      priority: body.priority ? String(body.priority).trim() : undefined,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.createRecurrenceRule = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const body = req.body || {};
    const rule = await templatesService.createRecurrenceRule(firmId, {
      templateId: parseEntityId(body.templateId, 'templateId'),
      clientId: parseEntityId(body.clientId || body.clientId, 'clientId'),
      frequency: body.frequency,
      nextPeriod: body.nextPeriod,
      nextDueDate: body.nextDueDate,
      assignedStaffId: body.assignedStaffId ? parseEntityId(body.assignedStaffId, 'assignedStaffId') : null,
    });
    return res.status(201).json({ rule });
  } catch (err) {
    return next(err);
  }
};

exports.generateRecurrence = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await operationalService.generateNextFromRule({
      firmId,
      ruleId: parseEntityId(req.params.id, 'id'),
      createdByUserId: req.user?.id,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};
