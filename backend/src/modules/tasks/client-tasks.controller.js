const { getRepository } = require('../../db/supabase/repositories');
const { requireUserFirmId, parseClientIdFromRequest } = require('../../utils/contabil-scope');

exports.list = async (req, res, next) => {
  try {
    const clientId = parseClientIdFromRequest(req.query);
    const { status } = req.query;
    const statusIn = status ? [String(status).trim()] : undefined;
    const items = await getRepository().listClientTasks({
      firmId: requireUserFirmId(req),
      clientId,
      statusIn,
    });
    return res.json({ items, total: items.length, page: 1, limit: items.length });
  } catch (err) {
    return next(err);
  }
};
