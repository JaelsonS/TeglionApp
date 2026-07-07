const { isContabilMode } = require('../../config/product-mode');

function contabilModeGuard(req, res, next) {
  if (!isContabilMode()) {
    return res.status(404).json({
      code: 'CONTABIL_MODE_DISABLED',
      message: 'API TegLion disponível apenas com PRODUCT_MODE=contabil',
    });
  }
  return next();
}

module.exports = { contabilModeGuard };
