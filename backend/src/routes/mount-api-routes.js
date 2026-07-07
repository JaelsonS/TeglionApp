/**
 * Monta rotas da API com prefixo opcional e header de depreciação no legado `/api`.
 */
function mountApiRoutes(app, { prefix = '/api', deprecated = false } = {}) {
  const contabilAuthRoutes = require('./contabil-auth.routes');
  const contabilPublicRoutes = require('./contabil-public.routes');
  const contabilPortalRoutes = require('./contabil-portal.routes');
  const contabilRoutes = require('./contabil.routes');

  if (deprecated) {
    app.use(prefix, (req, res, next) => {
      res.setHeader('Deprecation', 'true');
      res.setHeader('Link', '</api/v1>; rel="successor-version"');
      next();
    });
  }

  app.use(`${prefix}/auth`, contabilAuthRoutes);
  app.use(`${prefix}/public`, contabilPublicRoutes);
  app.use(`${prefix}/contabil`, contabilRoutes);
  app.use(`${prefix}/client-portal`, contabilPortalRoutes);
}

module.exports = { mountApiRoutes };
