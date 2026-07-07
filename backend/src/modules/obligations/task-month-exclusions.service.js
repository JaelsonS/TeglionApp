const { getRepository } = require('../../db/supabase/repositories');
const taskMonthExclusionsRepo = require('../../db/supabase/repositories/task-month-exclusions.repository');
const { AppError } = require('../../middlewares/error.middleware');

function normalizeMonth(raw, fallbackPeriod) {
  const m = String(raw || fallbackPeriod || '').trim().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(m)) {
    throw new AppError('Mês inválido (use YYYY-MM)', 400);
  }
  return m;
}

function collectMonthsFromItems(items, periodFilter) {
  const months = new Set();
  if (periodFilter) months.add(String(periodFilter).slice(0, 7));
  for (const ob of items) {
    const p = String(ob.period || '').slice(0, 7);
    if (p) months.add(p);
  }
  if (!months.size) {
    const now = new Date();
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }
  return [...months];
}

async function listExclusionsForFirm({ firmId, clientId, months }) {
  return taskMonthExclusionsRepo.listForFirm({ firmId, clientId, months });
}

function applyExclusionsToObligations(items, exclusions, { includeExcluded = false }) {
  if (includeExcluded) {
    return items.map((ob) => ({
      ...ob,
      monthExcluded: taskMonthExclusionsRepo.isObligationExcluded(exclusions, ob),
    }));
  }
  return items.filter((ob) => !taskMonthExclusionsRepo.isObligationExcluded(exclusions, ob));
}

async function excludeObligationFromMonth({ firmId, obligationId, month, createdByUserId }) {
  const repo = getRepository();
  const ob = await repo.findObligationById(obligationId, firmId);
  if (!ob) throw new AppError('Obrigação não encontrada', 404);
  const useMonth = normalizeMonth(month, ob.period);
  const row = await taskMonthExclusionsRepo.upsertObligationExclusionSafe({
    firmId,
    clientId: ob.clientId || ob.clientId,
    obligationId: ob._id || ob.id,
    month: useMonth,
    createdBy: createdByUserId,
  });
  return { exclusion: row, obligationId: ob._id || ob.id, month: useMonth };
}

async function restoreObligationForMonth({ firmId, obligationId, month }) {
  const repo = getRepository();
  const ob = await repo.findObligationById(obligationId, firmId);
  if (!ob) throw new AppError('Obrigação não encontrada', 404);
  const useMonth = normalizeMonth(month, ob.period);
  await taskMonthExclusionsRepo.removeObligationExclusion({
    firmId,
    clientId: ob.clientId || ob.clientId,
    obligationId: ob._id || ob.id,
    month: useMonth,
  });
  return { ok: true, obligationId: ob._id || ob.id, month: useMonth };
}

module.exports = {
  collectMonthsFromItems,
  listExclusionsForFirm,
  applyExclusionsToObligations,
  excludeObligationFromMonth,
  restoreObligationForMonth,
};
