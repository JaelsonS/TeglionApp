const navBadgesService = require('./nav-badges.service');

exports.getNavBadges = async (req, res, next) => {
  try {
    const firmId = req.user.firmId;
    const data = await navBadgesService.getNavBadges({ firmId, user: req.user });
    res.json(data);
  } catch (err) {
    next(err);
  }
};
