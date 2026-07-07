const rateLimit = require('express-rate-limit');
const { createRateLimitStore } = require('./rate-limit-store');

function createAuthLimiter({ prefix, windowMs = 15 * 60 * 1000, max, message }) {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req) => {
      const ip = req.ip || req.socket?.remoteAddress || 'unknown';
      return `${ip}`;
    },
    store: createRateLimitStore(prefix),
    standardHeaders: true,
    legacyHeaders: false,
    message: message || {
      message: 'Muitas tentativas. Aguarde alguns minutos.',
      code: 'RATE_LIMIT',
    },
  });
}

const firmLoginLimiter = createAuthLimiter({ prefix: 'rl:auth:login:', max: 10 });
const recoverLimiter = createAuthLimiter({ prefix: 'rl:auth:recover:', max: 5 });
const refreshLimiter = createAuthLimiter({ prefix: 'rl:auth:refresh:', max: 60 });
const registerFirmLimiter = createAuthLimiter({
  prefix: 'rl:auth:register-firm:',
  max: 5,
  message: {
    message: 'Muitas tentativas de registo. Aguarde alguns minutos.',
    code: 'RATE_LIMIT',
  },
});

module.exports = {
  createAuthLimiter,
  firmLoginLimiter,
  recoverLimiter,
  refreshLimiter,
  registerFirmLimiter,
};
