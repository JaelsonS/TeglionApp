/**
 * Bloqueia pedidos cujo IP está na denylist activa (cache em memória).
 * Fail-open se a BD falhar. Health checks isentos.
 */
const { clientIp } = require('../utils/client-ip');
const ipDenylist = require('../modules/platform-ops/ip-denylist.service');

function isExemptPath(url) {
  const path = String(url || '').split('?')[0];
  if (path === '/health' || path === '/api/health' || path === '/api/public/health') return true;
  if (path === '/') return true;
  // Webhooks de pagamento: não cortar por IP de denylist acidental de infra Stripe.
  if (path === '/api/public/stripe/webhook') return true;
  if (path === '/api/public/stripe/connect/webhook') return true;
  return false;
}

function ipDenylistMiddleware(req, res, next) {
  if (isExemptPath(req.originalUrl || req.url)) {
    return next();
  }

  const ip = clientIp(req);
  if (!ip) return next();

  void ipDenylist
    .isDenied(ip)
    .then((denied) => {
      if (!denied) return next();
      return res.status(403).json({
        error: 'Acesso bloqueado',
        code: 'IP_DENIED',
        message: 'O seu endereço IP está temporariamente bloqueado.',
      });
    })
    .catch(() => next());
}

module.exports = { ipDenylistMiddleware, isExemptPath };
