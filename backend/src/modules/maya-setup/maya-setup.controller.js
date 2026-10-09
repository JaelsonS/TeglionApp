const { requireUserFirmId } = require('../../utils/contabil-scope');
const mayaSetupService = require('./maya-setup.service');

exports.createSession = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await mayaSetupService.createSession({
      firmId,
      actorUserId: req.user.id,
      answers: req.body?.answers || req.body,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getSession = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await mayaSetupService.getSession({
      firmId,
      actorUserId: req.user.id,
      sessionId: req.params.id,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.generate = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await mayaSetupService.generateProposal({
      firmId,
      actorUserId: req.user.id,
      sessionId: req.params.id,
      req,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.capabilities = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const capabilities = await mayaSetupService.getCapabilities({ firmId });
    return res.json({ capabilities });
  } catch (err) {
    return next(err);
  }
};

exports.advise = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await mayaSetupService.adviseSetupQuestion({
      firmId,
      actorUserId: req.user.id,
      question: req.body?.question,
      context: req.body?.context,
      req,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.apply = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await mayaSetupService.applyProposal({
      firmId,
      actorUserId: req.user.id,
      sessionId: req.params.id,
      req,
      proposalOverride: req.body?.proposal,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.seedDemoPublicSite = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const result = await mayaSetupService.seedDemoPublicSite({
      firmId,
      actorUserId: req.user.id,
      req,
      includeDemoClients: req.body?.includeDemoClients === true,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
