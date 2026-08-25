/**
 * IP do cliente para logs/auditoria. Usa req.ip (Express), que já resolve
 * X-Forwarded-For respeitando `trust proxy` — nunca lê o header diretamente,
 * que um chamador pode forjar livremente para corromper registos de auditoria.
 */
function clientIp(req) {
  return req?.ip || req?.socket?.remoteAddress || null;
}

function clientUserAgent(req) {
  const ua = req?.headers?.['user-agent'];
  return typeof ua === 'string' ? ua.slice(0, 2000) : null;
}

module.exports = { clientIp, clientUserAgent };
