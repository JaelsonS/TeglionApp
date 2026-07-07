const teamService = require('./team.service');
const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');

exports.list = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const items = await teamService.listMembers(firmId);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const member = await teamService.createMember({
      firmId,
      actor: req.user,
      payload: req.body || {},
      req,
    });
    return res.status(201).json({ member });
  } catch (err) {
    return next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const memberId = parseEntityId(req.params.id, 'id');
    const member = await teamService.getMember(firmId, memberId);
    return res.json({ member });
  } catch (err) {
    return next(err);
  }
};

exports.patch = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const memberId = parseEntityId(req.params.id, 'id');
    const member = await teamService.updateMember({
      firmId,
      memberId,
      actor: req.user,
      payload: req.body || {},
      req,
    });
    return res.json({ member });
  } catch (err) {
    return next(err);
  }
};

exports.deactivate = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const memberId = parseEntityId(req.params.id, 'id');
    const member = await teamService.deactivateMember({
      firmId,
      memberId,
      actor: req.user,
      req,
    });
    return res.json({ member });
  } catch (err) {
    return next(err);
  }
};

exports.reactivate = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const memberId = parseEntityId(req.params.id, 'id');
    const member = await teamService.reactivateMember({
      firmId,
      memberId,
      actor: req.user,
      req,
    });
    return res.json({ member });
  } catch (err) {
    return next(err);
  }
};
