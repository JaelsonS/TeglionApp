const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { AppError } = require('../../middlewares/error.middleware');
const contabilAuth = require('./contabil-auth.service');
const contabilInvitesService = require('../firm/invites.service');
const authRefreshSessionsRepository = require('../../db/supabase/repositories/auth-refresh-sessions.repository');
const {
  setRefreshTokenCookie,
  setAccessTokenCookie,
  clearRefreshTokenCookie,
  clearAccessTokenCookie,
} = require('../../utils/auth-cookies');
const { logAuthSecurity } = require('../../middlewares/auth-security-log.middleware');

function assertValid(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Dados inválidos', 400, { errors: errors.array() });
  }
}

function buildAuthResponseBody(result, extra = {}) {
  return {
    user: result.user,
    ...extra,
  };
}

async function loginFirm(req, res, next) {
  try {
    assertValid(req);
    const { email, password, rememberMe } = req.body;
    const result = await contabilAuth.loginFirm({ email, password, req });
    setRefreshTokenCookie(res, result.tokens.refreshToken, { rememberMe: Boolean(rememberMe), req });
    setAccessTokenCookie(res, result.tokens.accessToken, { req });
    return res.status(200).json(
      buildAuthResponseBody(result, { firmAccess: result.firmAccess || undefined }),
    );
  } catch (err) {
    return next(err);
  }
}

async function loginClient(req, res, next) {
  try {
    assertValid(req);
    const { email, password, rememberMe, firmSlug } = req.body;
    const result = await contabilAuth.loginClient({ email, password, firmSlug, req });
    setRefreshTokenCookie(res, result.tokens.refreshToken, { rememberMe: Boolean(rememberMe), req });
    setAccessTokenCookie(res, result.tokens.accessToken, { req });
    return res.status(200).json(buildAuthResponseBody(result));
  } catch (err) {
    return next(err);
  }
}

async function registerClientInvite(req, res, next) {
  try {
    assertValid(req);
    const { token, email, password, fullName } = req.body;
    await contabilInvitesService.registerClientWithInvite({ token, email, password, fullName });
    const result = await contabilAuth.loginClient({ email, password, req });
    setRefreshTokenCookie(res, result.tokens.refreshToken, { req });
    setAccessTokenCookie(res, result.tokens.accessToken, { req });
    return res.status(201).json(buildAuthResponseBody(result));
  } catch (err) {
    return next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      logAuthSecurity('refresh_missing_cookie', req);
      throw new AppError(
        'Sessão não encontrada. Inicie sessão novamente.',
        401,
        undefined,
        'REFRESH_TOKEN_MISSING',
      );
    }
    const result = await contabilAuth.refreshSession({ refreshToken });
    setRefreshTokenCookie(res, result.tokens.refreshToken, { req });
    setAccessTokenCookie(res, result.tokens.accessToken, { req });
    return res.status(200).json(buildAuthResponseBody(result));
  } catch (err) {
    const code = err?.code || err?.details?.code;
    const missingCookie = code === 'REFRESH_TOKEN_MISSING';
    if (!missingCookie) {
      logAuthSecurity('refresh_failed', req, {
        code: code || err?.message,
      });
      clearRefreshTokenCookie(res, { req });
      clearAccessTokenCookie(res, { req });
    }
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const decoded = jwt.decode(refreshToken);
      const jti = decoded && typeof decoded === 'object' ? decoded.jti : null;
      if (typeof jti === 'string' && jti) {
        await authRefreshSessionsRepository.deleteByJti(jti);
      }
    }
    clearRefreshTokenCookie(res, { req });
    clearAccessTokenCookie(res, { req });
    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await contabilAuth.getMe(req.user.id, req.user.role);
    return res.status(200).json({ user });
  } catch (err) {
    return next(err);
  }
}

async function completeOnboarding(req, res, next) {
  try {
    const user = await contabilAuth.completeOnboarding(req.user.id);
    return res.status(200).json({ user });
  } catch (err) {
    return next(err);
  }
}

async function registerFirm(req, res, next) {
  try {
    assertValid(req);
    const { firmName, ownerName, email, password, countryCode, legalConsents } = req.body;
    const { clientIp, clientUserAgent } = require('../../utils/client-ip');
    const result = await contabilAuth.registerFirm({
      firmName,
      ownerName,
      email,
      password,
      countryCode,
      legalConsents: {
        ...legalConsents,
        ipAddress: clientIp(req),
        userAgent: clientUserAgent(req),
      },
    });
    if (result.needsEmailConfirmation) {
      return res.status(201).json({
        needsEmailConfirmation: true,
        emailSent: result.emailSent,
        email: result.email,
        firmName: result.firmName,
        message: result.message,
      });
    }
    setRefreshTokenCookie(res, result.tokens.refreshToken, { req });
    setAccessTokenCookie(res, result.tokens.accessToken, { req });
    return res.status(201).json(buildAuthResponseBody(result));
  } catch (err) {
    return next(err);
  }
}

async function registerFirmGoogle(req, res, next) {
  try {
    assertValid(req);
    const googleSsoController = require('./google/google-sso.controller');
    const pending = googleSsoController.readPendingRegistration(req);
    if (!pending) {
      throw new AppError('Sessão Google expirada. Volte a usar «Continuar com Google».', 401, {
        code: 'SSO_PENDING_NOT_FOUND',
      });
    }
    const { firmName, ownerName, countryCode, legalConsents } = req.body;
    const { clientIp, clientUserAgent } = require('../../utils/client-ip');
    const result = await contabilAuth.registerFirmWithGoogle({
      firmName,
      ownerName: ownerName || pending.ownerName,
      email: pending.email,
      googleSub: pending.googleSub,
      countryCode: countryCode || pending.countryCode,
      legalConsents: {
        ...legalConsents,
        ipAddress: clientIp(req),
        userAgent: clientUserAgent(req),
      },
      req,
    });
    googleSsoController.clearPendingRegistrationCookie(res, req);
    setRefreshTokenCookie(res, result.tokens.refreshToken, { req });
    setAccessTokenCookie(res, result.tokens.accessToken, { req });
    return res.status(201).json(buildAuthResponseBody(result));
  } catch (err) {
    return next(err);
  }
}

async function recoverPassword(req, res, next) {
  try {
    assertValid(req);
    const { email, role } = req.body;
    const result = await contabilAuth.requestPasswordRecovery({ email, role });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

async function validateResetToken(req, res, next) {
  try {
    assertValid(req);
    const { token } = req.body;
    await contabilAuth.validateResetToken({ token });
    return res.status(200).json({ valid: true });
  } catch (err) {
    return next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    assertValid(req);
    const { token, newPassword } = req.body;
    await contabilAuth.resetPasswordWithToken({ token, newPassword, req });
    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  loginFirm,
  loginClient,
  registerClientInvite,
  registerFirm,
  registerFirmGoogle,
  recoverPassword,
  validateResetToken,
  resetPassword,
  refresh,
  logout,
  me,
  completeOnboarding,
};
