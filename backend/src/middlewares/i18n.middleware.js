const { resolveRequestLocale, t } = require('../i18n');

function i18nMiddleware(req, res, next) {
  const locale = resolveRequestLocale(req);
  req.locale = locale;
  req.t = (key, vars = {}) => t(locale, key, vars);
  res.locals.locale = locale;
  return next();
}

module.exports = { i18nMiddleware };
