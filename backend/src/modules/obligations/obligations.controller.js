const firmObligations = require('./firm-obligations.service');
const obligationsFirm = require('./obligations-firm.service');
const operationalService = require('./obligation-operational.service');
const monthExclusionsService = require('./task-month-exclusions.service');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const { getRepository } = require('../../db/supabase/repositories');
const { requireUserFirmId, parseEntityId, parseClientIdFromRequest } = require('../../utils/contabil-scope');
const { AppError } = require('../../middlewares/error.middleware');

exports.list = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const clientId = parseClientIdFromRequest(req.query);
    const { period, status, lane } = req.query;
    const includeExcluded =
      req.query.includeExcluded === 'true' || req.query.includeExcluded === '1';
    const { items: listed, monthExclusions } = await operationalService.listObligationsOperational({
      firmId,
      clientId,
      period: period ? String(period).trim() : undefined,
      lane: lane ? String(lane).trim() : undefined,
      includeExcluded,
    });
    let items = listed;

    const viewTracking = require('../../services/tracking/view-tracking.service');
    items = await Promise.all(
      items.map(async (ob) => {
        const viewStats = await viewTracking
          .getViewStats({ firmId, entityType: 'OBLIGATION', entityId: ob._id || ob.id })
          .catch(() => null);
        return { ...ob, viewStats };
      })
    );

    if (status) {
      const s = String(status).trim();
      items = items.filter((o) => o.status === s);
    }

    return res.json({
      items,
      monthExclusions,
      total: items.length,
      page: 1,
      limit: items.length,
    });
  } catch (err) {
    return next(err);
  }
};

exports.listStaff = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const items = await firmUsersRepository.listFirmUsers(firmId);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const body = req.body || {};
    const clientId = parseClientIdFromRequest(body);
    const {
      type,
      period,
      title,
      dueDate,
      assignedStaffId,
      notes,
      accountantNotes,
      amountCents,
      priority,
      createClientTask,
    } = body;
    if (!clientId || !type || !period || !dueDate) {
      throw new AppError('clientId, type, period e dueDate são obrigatórios', 400);
    }
    const hasGuide = Boolean(req.file);
    const parsedAmount =
      amountCents != null && amountCents !== '' ? Number(amountCents) : null;
    const result = await firmObligations.createObligationWithTask({
      firmId: firmId,
      clientId: clientId,
      type: String(type).trim(),
      period: String(period).trim(),
      title: title ? String(title).trim() : null,
      dueDate,
      assignedStaffId: assignedStaffId ? parseEntityId(assignedStaffId, 'assignedStaffId') : null,
      notes: notes ? String(notes).trim() : null,
      accountantNotes: accountantNotes ? String(accountantNotes).trim() : null,
      amountCents: parsedAmount != null && !Number.isNaN(parsedAmount) ? parsedAmount : null,
      priority: priority ? String(priority).trim() : 'NORMAL',
      createdByUserId: req.user?.id || null,
      createClientTask: createClientTask !== false && createClientTask !== 'false',
      skipClientNotify: hasGuide,
    });
    if (hasGuide) {
      const guide = await obligationsFirm.uploadGuideToObligation({
        firmId: firmId,
        obligationId: result.obligation._id || result.obligation.id,
        file: req.file,
        actorId: req.user?.id,
        actorName: req.user?.name || req.user?.fullName || 'Escritório',
        documentKind: req.body?.documentKind || req.body?.guideType || null,
        notifyClient: true,
      });
      return res.status(201).json({ ...result, guide });
    }
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const obligation = await firmObligations.updateObligation({
      firmId,
      obligationId: parseEntityId(req.params.id, 'id'),
      patch: req.body || {},
    });
    return res.json({ obligation });
  } catch (err) {
    return next(err);
  }
};

exports.dashboard = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const dashboard = await firmObligations.getFirmDashboard({ firmId });
    return res.json(dashboard);
  } catch (err) {
    return next(err);
  }
};

exports.uploadGuide = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await obligationsFirm.uploadGuideToObligation({
      firmId: firmId,
      obligationId: parseEntityId(req.params.id, 'id'),
      file: req.file,
      actorId: req.user?.id,
      actorName: req.user?.name || req.user?.fullName,
      documentKind: req.body?.documentKind || req.body?.guideType || null,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getTimeline = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await obligationsFirm.getObligationTimeline({
      firmId: firmId,
      obligationId: parseEntityId(req.params.id, 'id'),
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.excludeFromMonth = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const obligationId = parseEntityId(req.params.id, 'id');
    const month = req.body?.month ? String(req.body.month).trim() : undefined;
    const result = await monthExclusionsService.excludeObligationFromMonth({
      firmId,
      obligationId,
      month,
      createdByUserId: req.user?.id || req.user?._id,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.restoreForMonth = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const obligationId = parseEntityId(req.params.id, 'id');
    const month = req.query.month ? String(req.query.month).trim() : req.body?.month;
    const result = await monthExclusionsService.restoreObligationForMonth({
      firmId,
      obligationId,
      month,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.listDocuments = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const clientId = parseClientIdFromRequest(req.query);
    const { period, limit, validationStatus, obligationId, page } = req.query;
    const result = await firmObligations.listFirmDocuments({
      firmId: firmId,
      clientId: clientId,
      period: period ? String(period).trim() : undefined,
      validationStatus: validationStatus ? String(validationStatus).trim() : undefined,
      obligationId: obligationId ? parseEntityId(obligationId, 'obligationId') : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
