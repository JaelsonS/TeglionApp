const { validationResult } = require('express-validator');
const officialAccessesService = require('./official-accesses.service');
const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');
const { AppError } = require('../../middlewares/error.middleware');

function assertValid(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Pedido inválido.', 400, { code: 'VALIDATION_ERROR', errors: errors.array() });
  }
}

function actorFrom(req) {
  return {
    actorId: String(req.user.id),
    actorRole: req.user.role || 'FIRM',
  };
}

exports.list = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const clientId = parseEntityId(req.params.id, 'clientId');
    const data = await officialAccessesService.listOfficialAccesses({
      firmId,
      clientId,
      actorId: String(req.user.id),
    });
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.upsert = async (req, res, next) => {
  try {
    assertValid(req);
    const firmId = requireUserFirmId(req);
    const clientId = parseEntityId(req.params.id, 'clientId');
    const { actorId, actorRole } = actorFrom(req);
    const data = await officialAccessesService.upsertOfficialAccess({
      firmId,
      clientId,
      actorId,
      actorRole,
      currentPassword: req.body?.currentPassword,
      stepUpToken: req.body?.stepUpToken,
      rememberSession: req.body?.rememberSession === true,
      totpCode: req.body?.totpCode,
      portalKey: req.body?.portalKey,
      accessId: req.body?.accessId ? parseEntityId(req.body.accessId, 'accessId') : null,
      label: req.body?.label,
      username: req.body?.username,
      password: req.body?.password,
      req,
    });
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.reveal = async (req, res, next) => {
  try {
    assertValid(req);
    const firmId = requireUserFirmId(req);
    const clientId = parseEntityId(req.params.id, 'clientId');
    const accessId = parseEntityId(req.params.accessId, 'accessId');
    const { actorId, actorRole } = actorFrom(req);
    const data = await officialAccessesService.revealOfficialAccess({
      firmId,
      clientId,
      accessId,
      actorId,
      actorRole,
      currentPassword: req.body?.currentPassword,
      stepUpToken: req.body?.stepUpToken,
      rememberSession: req.body?.rememberSession === true,
      totpCode: req.body?.totpCode,
      req,
    });
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    assertValid(req);
    const firmId = requireUserFirmId(req);
    const clientId = parseEntityId(req.params.id, 'clientId');
    const accessId = parseEntityId(req.params.accessId, 'accessId');
    const { actorId, actorRole } = actorFrom(req);
    const data = await officialAccessesService.removeOfficialAccess({
      firmId,
      clientId,
      accessId,
      actorId,
      actorRole,
      currentPassword: req.body?.currentPassword,
      stepUpToken: req.body?.stepUpToken,
      rememberSession: req.body?.rememberSession === true,
      totpCode: req.body?.totpCode,
      req,
    });
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};
