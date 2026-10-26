const saftService = require('./saft.service');

exports.meta = async (_req, res, next) => {
  try {
    return res.json(await saftService.getMeta());
  } catch (err) {
    return next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const result = await saftService.listImports({
      firmId: String(req.user.firmId),
      clientId: req.query.clientId || undefined,
      limit: req.query.limit,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const result = await saftService.getImport({
      firmId: String(req.user.firmId),
      importId: String(req.params.id),
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.importFile = async (req, res, next) => {
  try {
    const result = await saftService.importSaft({
      firmId: String(req.user.firmId),
      clientId: req.body?.clientId || req.query.clientId,
      actorId: req.user.id,
      file: req.file,
    });
    return res.status(result.duplicate ? 200 : 201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const result = await saftService.removeImport({
      firmId: String(req.user.firmId),
      importId: String(req.params.id),
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
