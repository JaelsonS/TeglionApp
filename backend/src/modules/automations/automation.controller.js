const { validationResult } = require('express-validator');
const { env } = require('../../config/env');
const { requireUserFirmId } = require('../../utils/contabil-scope');
const automationService = require('./automation.service');
const { AppError } = require('../../middlewares/error.middleware');

function assertValid(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Dados inválidos', 400, { errors: errors.array() });
  }
}

exports.listRules = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const items = await automationService.listRules(firmId);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
};

exports.upsertRule = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const rule = await automationService.upsertRule(firmId, req.body);
    return res.json({ rule });
  } catch (err) {
    return next(err);
  }
};

exports.runNow = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const summary = await automationService.runAutomationsForFirm(firmId);
    return res.json(summary);
  } catch (err) {
    return next(err);
  }
};

/** Cron interno — montado antes de authMiddleware; firmId validado no router. */
exports.runCronForFirm = async (req, res, next) => {
  try {
    assertValid(req);
    const firmId = req.body?.firmId || req.query?.firmId;
    if (!firmId) throw new AppError('firmId obrigatório', 400);
    const summary = await automationService.runAutomationsForFirm(firmId);
    return res.json(summary);
  } catch (err) {
    return next(err);
  }
};

exports.runAllFirms = async (req, res, next) => {
  try {
    const cronSecret = req.headers['x-cron-secret'];
    if (!cronSecret || !env.CRON_SECRET || cronSecret !== env.CRON_SECRET) {
      throw new AppError('Não autorizado', 403);
    }
    const { getSupabaseAdmin } = require('../../db/supabase/client');
    const sb = getSupabaseAdmin();
    const { data: firms, error } = await sb.from('firms').select('id').eq('status', 'ACTIVE');
    if (error) throw error;
    const results = [];
    for (const f of firms || []) {
      const summary = await automationService.runAutomationsForFirm(f.id);
      results.push({ firmId: f.id, ...summary });
    }
    return res.json({ firms: results.length, results });
  } catch (err) {
    return next(err);
  }
};
