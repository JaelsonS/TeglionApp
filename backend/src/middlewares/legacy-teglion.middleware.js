/**
 * Bloqueia rotas legadas (marketplace clínico / SaaSude) quando PRODUCT_MODE=contabil.
 */
const { isContabilMode } = require('../config/product-mode');

function blockLegacyTeglionRoutes(req, res, next) {
  if (!isContabilMode()) return next();
  return res.status(410).json({
    code: 'LEGACY_ROUTE_DISABLED',
    message:
      'Este endpoint foi desactivado. Use as rotas /api/contabil/* ou /api/client-portal/* no TegLion.',
    path: req.originalUrl,
  });
}

module.exports = { blockLegacyTeglionRoutes };
