const rateLimit = require('express-rate-limit');
const { createRateLimitStore } = require('./rate-limit-store');
const { verifyMfaChallengeToken } = require('../config/jwt');

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

const officialAccessStepUpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anon';
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    return `${userId}:${ip}`;
  },
  store: createRateLimitStore('rl:vault:stepup:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Muitas tentativas de confirmação. Aguarde alguns minutos.',
    code: 'RATE_LIMIT',
  },
});

/**
 * MFA challenge/enroll/disable/regenerate — chave por utilizador-alvo + IP.
 *
 * F-04: quando não havia sessão (challenge/verify, antes do login terminar),
 * a chave usava o próprio challengeToken — novo a cada login — então o limite
 * de tentativas reiniciava sempre que se pedia um challenge novo: até
 * ~10 logins × 8 tentativas = 80 palpites/15min por IP, muito acima do 8/15min
 * pretendido. A identidade correcta nesse momento já vem cifrada dentro do
 * próprio JWT do desafio (claim `id`) — decodificada aqui só para chavear o
 * limite, nunca para autorizar nada (a verificação real continua a acontecer
 * no handler). `req.user.id` cobre o caso deste limiter vir a ser montado
 * depois de `authMiddleware` numa rota futura — hoje nenhuma rota que o usa
 * chega aqui com sessão já resolvida.
 */
function mfaChallengeKey(req) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  if (req.user?.id) {
    return `${req.user.id}:${ip}`;
  }
  const bodyToken = req.body?.challengeToken;
  const headerToken = req.headers['x-mfa-challenge'];
  const cookieToken = req.cookies?.mfaChallengeToken;
  const rawToken = String(bodyToken || headerToken || cookieToken || '');
  let userPart = 'invalid-challenge';
  if (rawToken) {
    try {
      const payload = verifyMfaChallengeToken(rawToken);
      userPart = payload.id;
    } catch {
      // Token inválido/expirado — todos caem no mesmo balde "invalid-challenge"
      // por IP; o handler real vai rejeitar de qualquer forma.
    }
  }
  return `${userPart}:${ip}`;
}

const mfaVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyGenerator: mfaChallengeKey,
  store: createRateLimitStore('rl:mfa:verify:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Muitas tentativas MFA. Aguarde alguns minutos.',
    code: 'RATE_LIMIT',
  },
});

const mfaEnrollLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: mfaChallengeKey,
  store: createRateLimitStore('rl:mfa:enroll:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Muitas tentativas de configuração MFA. Aguarde alguns minutos.',
    code: 'RATE_LIMIT',
  },
});

module.exports = {
  createAuthLimiter,
  firmLoginLimiter,
  recoverLimiter,
  refreshLimiter,
  registerFirmLimiter,
  officialAccessStepUpLimiter,
  mfaVerifyLimiter,
  mfaEnrollLimiter,
  mfaChallengeKey,
};
