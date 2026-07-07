const legalConsentsService = require('./legal-consents.service');

exports.getVersions = async (_req, res, next) => {
  try {
    return res.json(legalConsentsService.getPublicVersions());
  } catch (err) {
    return next(err);
  }
};
