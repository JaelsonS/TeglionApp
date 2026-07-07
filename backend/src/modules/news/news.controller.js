const newsService = require('./news.service');

exports.listFirm = async (req, res, next) => {
  try {
    const items = await newsService.listForFirm({
      firmId: String(req.user.firmId),
      status: req.query.status,
    });
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
};

exports.getTemplates = async (_req, res, next) => {
  try {
    return res.json({ templates: newsService.getEditorTemplates() });
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const article = await newsService.createArticle({
      firmId: String(req.user.firmId),
      payload: req.body,
      authorId: req.user.id,
      authorName: req.user.name || req.user.fullName || req.user.email || 'Escritório',
    });
    return res.status(201).json({ article });
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const article = await newsService.updateArticle({
      firmId: String(req.user.firmId),
      id: req.params.id,
      payload: req.body,
    });
    return res.json({ article });
  } catch (err) {
    return next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await newsService.deleteArticle({ firmId: String(req.user.firmId), id: req.params.id });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
};

exports.uploadCover = async (req, res, next) => {
  try {
    const result = await newsService.uploadCoverImage({
      firmId: String(req.user.firmId),
      file: req.file,
    });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.listClientFeed = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const items = await newsService.listPublishedForClient({
      firmId,
      category: req.query.category,
      search: req.query.search,
    });
    const featured = items.filter((a) => a.isFeatured).slice(0, 3);
    return res.json({ items, featured });
  } catch (err) {
    return next(err);
  }
};

exports.getClientArticle = async (req, res, next) => {
  try {
    const article = await newsService.getBySlug({
      firmId: String(req.user.firmId),
      slug: req.params.slug,
    });
    if (article.status !== 'PUBLISHED') {
      return res.status(404).json({ message: 'Artigo não disponível' });
    }
    return res.json({ article });
  } catch (err) {
    return next(err);
  }
};
