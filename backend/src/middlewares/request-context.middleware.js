/**
 * Injeta X-Request-Id para correlação de logs entre edge, API e clientes.
 * Respeita cabeçalho existente de proxies/load balancers.
 */

const { randomUUID } = require('crypto');

function requestContextMiddleware(req, res, next) {
  const headerId = req.get('x-request-id') || req.get('X-Request-Id');
  const id = headerId && String(headerId).trim() ? String(headerId).trim() : randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}

module.exports = { requestContextMiddleware };
