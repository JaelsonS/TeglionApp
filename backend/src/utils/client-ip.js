function clientIp(req) {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req?.socket?.remoteAddress || req?.ip || null;
}

function clientUserAgent(req) {
  const ua = req?.headers?.['user-agent'];
  return typeof ua === 'string' ? ua.slice(0, 2000) : null;
}

module.exports = { clientIp, clientUserAgent };
