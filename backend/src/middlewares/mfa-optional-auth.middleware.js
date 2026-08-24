/**
 * Autenticação opcional para rotas MFA de enrollment:
 * - challenge token (cookie/body/header) → sem sessão
 * - senão → authMiddleware normal
 */
const { authMiddleware } = require('./auth.middleware');
const { MFA_CHALLENGE_COOKIE } = require('../utils/auth-cookies');

function hasMfaChallengeCredential(req) {
  const fromBody = req.body?.challengeToken;
  const fromHeader = req.headers['x-mfa-challenge'];
  const fromCookie = req.cookies?.[MFA_CHALLENGE_COOKIE];
  return Boolean(String(fromBody || fromHeader || fromCookie || '').trim());
}

function optionalAuthIfNoMfaChallenge(req, res, next) {
  if (hasMfaChallengeCredential(req)) {
    return next();
  }
  return authMiddleware(req, res, next);
}

module.exports = { optionalAuthIfNoMfaChallenge, hasMfaChallengeCredential };
