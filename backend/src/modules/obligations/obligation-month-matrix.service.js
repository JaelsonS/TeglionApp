const { AppError } = require('../../middlewares/error.middleware');
const { getRepository } = require('../../db/supabase/repositories');
const { assertYearMonth, monthBounds, buildMonthMatrix } = require('./obligation-month-matrix');

async function getMonthMatrix({ firmId, yearMonth }) {
  let ym;
  try {
    ym = assertYearMonth(yearMonth);
  } catch (err) {
    throw new AppError(err.message, 400, err.code || 'INVALID_YEAR_MONTH');
  }
  const bounds = monthBounds(ym);
  const repo = getRepository();
  if (typeof repo.maybeSyncOverdueObligations === 'function') {
    await repo.maybeSyncOverdueObligations(firmId).catch(() => {});
  }
  const items = await repo.listObligationsEnriched({
    firmId,
    dueDateGte: bounds.dueDateGte,
    dueDateLte: bounds.dueDateLte,
    limit: 800,
  });
  return buildMonthMatrix(items, ym);
}

module.exports = {
  getMonthMatrix,
};
