const rateLimit = require('express-rate-limit');
const { createRateLimitStore } = require('../../utils/rate-limit-store');

const mayaSetupGenerateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: Number(process.env.MAYA_SETUP_GENERATE_DAILY_LIMIT || 5),
  keyGenerator: (req) => {
    const firmId = req.user?.firmId || 'unknown';
    return `maya-setup-gen:${firmId}`;
  },
  store: createRateLimitStore('rl:maya-setup:gen:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Limite diário de gerações Maya atingido.',
    code: 'MAYA_SETUP_RATE_LIMIT',
  },
});

module.exports = { mayaSetupGenerateLimiter };
