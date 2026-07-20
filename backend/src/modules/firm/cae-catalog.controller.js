const { AppError } = require('../../middlewares/error.middleware');
const caeCatalogService = require('./cae-catalog.service');

exports.search = async (req, res, next) => {
  try {
    const q = req.query?.q != null ? String(req.query.q) : '';
    if (!q.trim()) {
      return res.json({ items: [], source: 'empty' });
    }
    if (q.length > 80) throw new AppError('Pesquisa demasiado longa', 400);

    const liveRaw = String(req.query?.live ?? '1').toLowerCase();
    const live = !(liveRaw === '0' || liveRaw === 'false');

    const result = await caeCatalogService.searchCae(q, { live });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
