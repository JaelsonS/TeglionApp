const { body, validationResult } = require('express-validator');
const { AppError } = require('../../middlewares/error.middleware');
const mfaService = require('./mfa.service');
const contabilAuth = require('./contabil-auth.service');
const {
  setRefreshTokenCookie,
  setAccessTokenCookie,
  clearMfaChallengeCookie,
  setMfaChallengeCookie,
  MFA_CHALLENGE_COOKIE,
} = require('../../utils/auth-cookies');

function assertValid(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Dados inválidos', 400, { errors: errors.array() });
  }
}

function readChallengeToken(req) {
  const fromBody = req.body?.challengeToken;
  const fromHeader = req.headers['x-mfa-challenge'];
  const fromCookie = req.cookies?.[MFA_CHALLENGE_COOKIE];
  return String(fromBody || fromHeader || fromCookie || '').trim() || null;
}

function issueSessionCookies(res, result, req) {
  clearMfaChallengeCookie(res, { req });
  setRefreshTokenCookie(res, result.tokens.refreshToken, { req });
  setAccessTokenCookie(res, result.tokens.accessToken, { req });
}

async function challengeStatus(req, res, next) {
  try {
    const challengeToken = readChallengeToken(req);
    if (!challengeToken) {
      throw new AppError('Desafio MFA ausente.', 401, { code: 'MFA_CHALLENGE_MISSING' });
    }
    const status = await mfaService.getStatusFromChallenge({ challengeToken });
    return res.status(200).json(status);
  } catch (err) {
    return next(err);
  }
}

async function sessionStatus(req, res, next) {
  try {
    const status = await mfaService.getStatusForSessionUser({
      userId: req.user.id,
      firmId: req.user.firmId,
    });
    return res.status(200).json(status);
  } catch (err) {
    return next(err);
  }
}

async function enrollBegin(req, res, next) {
  try {
    const challengeToken = readChallengeToken(req);
    const result = await mfaService.beginEnrollment({
      challengeToken,
      sessionUser: req.user
        ? { id: req.user.id, firmId: req.user.firmId }
        : null,
    });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

async function enrollConfirm(req, res, next) {
  try {
    assertValid(req);
    const challengeToken = readChallengeToken(req);
    const { code } = req.body;
    const confirmed = await mfaService.confirmEnrollment({
      challengeToken,
      sessionUser: req.user ? { id: req.user.id, firmId: req.user.firmId } : null,
      code,
      req,
    });
    const row = await require('../../db/supabase/repositories/firm-users.repository').findFirmUserById(
      confirmed.user.id,
      confirmed.user.firmId,
    );
    const issued = await contabilAuth.issueTokensForFirmUser(row);
    issueSessionCookies(res, issued, req);
    return res.status(200).json({
      status: mfaService.STATUS.AUTHENTICATED,
      user: issued.user,
      recoveryCodes: confirmed.recoveryCodes,
    });
  } catch (err) {
    return next(err);
  }
}

async function challengeVerify(req, res, next) {
  try {
    assertValid(req);
    const challengeToken = readChallengeToken(req);
    if (!challengeToken) {
      throw new AppError('Desafio MFA ausente.', 401, { code: 'MFA_CHALLENGE_MISSING' });
    }
    const { code, recoveryCode } = req.body;
    const verified = await mfaService.verifyChallenge({
      challengeToken,
      code,
      recoveryCode,
      req,
    });
    const issued = await contabilAuth.issueTokensForFirmUser(verified.row);
    issueSessionCookies(res, issued, req);
    return res.status(200).json({
      status: mfaService.STATUS.AUTHENTICATED,
      user: issued.user,
    });
  } catch (err) {
    return next(err);
  }
}

async function disable(req, res, next) {
  try {
    assertValid(req);
    const result = await mfaService.disableMfa({
      userId: req.user.id,
      firmId: req.user.firmId,
      code: req.body.code,
      recoveryCode: req.body.recoveryCode,
      req,
    });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

async function regenerateRecovery(req, res, next) {
  try {
    assertValid(req);
    const result = await mfaService.regenerateRecoveryCodes({
      userId: req.user.id,
      firmId: req.user.firmId,
      code: req.body.code,
      req,
    });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

const enrollConfirmValidators = [body('code').isString().matches(/^\d{6}$/)];
const challengeVerifyValidators = [
  body('code').optional().isString().matches(/^\d{6}$/),
  body('recoveryCode').optional().isString().isLength({ min: 8, max: 32 }),
];
const disableValidators = [
  body('code').optional().isString().matches(/^\d{6}$/),
  body('recoveryCode').optional().isString().isLength({ min: 8, max: 32 }),
];
const regenerateValidators = [body('code').isString().matches(/^\d{6}$/)];

module.exports = {
  challengeStatus,
  sessionStatus,
  enrollBegin,
  enrollConfirm,
  challengeVerify,
  disable,
  regenerateRecovery,
  enrollConfirmValidators,
  challengeVerifyValidators,
  disableValidators,
  regenerateValidators,
  readChallengeToken,
  setMfaChallengeCookie,
};
