const express = require('express');
const { body } = require('express-validator');
const contabilAuthController = require('../modules/auth/contabil-auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { requireTurnstile } = require('../middlewares/turnstile.middleware');
const { TURNSTILE_ACTIONS } = require('../services/turnstile/turnstile-actions');
const {
  firmLoginLimiter,
  recoverLimiter,
  refreshLimiter,
  registerFirmLimiter,
  mfaVerifyLimiter,
  mfaEnrollLimiter,
} = require('../utils/auth-rate-limit');
const { SAFE_NORMALIZE_EMAIL_OPTIONS } = require('../utils/normalize');
const mfaController = require('../modules/auth/mfa.controller');
const { optionalAuthIfNoMfaChallenge } = require('../middlewares/mfa-optional-auth.middleware');

const router = express.Router();

const emailField = () => body('email').isEmail().normalizeEmail(SAFE_NORMALIZE_EMAIL_OPTIONS);

const loginFirmValidators = [
  emailField(),
  body('password').isString().isLength({ min: 1 }),
  body('rememberMe').optional().isBoolean(),
];

const loginClientValidators = [
  emailField(),
  body('password').isString().isLength({ min: 1 }),
  body('rememberMe').optional().isBoolean(),
  body('firmSlug').optional().isString().trim().isLength({ min: 2, max: 64 }),
];

router.post(
  '/login-firm',
  firmLoginLimiter,
  requireTurnstile({ action: TURNSTILE_ACTIONS.LOGIN_FIRM }),
  loginFirmValidators,
  contabilAuthController.loginFirm,
);

router.post(
  '/login-client',
  firmLoginLimiter,
  requireTurnstile({ action: TURNSTILE_ACTIONS.LOGIN_CLIENT }),
  loginClientValidators,
  contabilAuthController.loginClient,
);

router.post(
  '/register-firm',
  registerFirmLimiter,
  requireTurnstile({ action: TURNSTILE_ACTIONS.REGISTER_FIRM }),
  [
    body('firmName').trim().notEmpty(),
    body('ownerName').trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 10 }),
    body('countryCode').optional().isString().trim().isLength({ min: 2, max: 2 }),
  ],
  contabilAuthController.registerFirm,
);

router.post(
  '/register-firm-google',
  registerFirmLimiter,
  requireTurnstile({ action: TURNSTILE_ACTIONS.REGISTER_FIRM_GOOGLE }),
  [
    body('firmName').trim().notEmpty(),
    body('ownerName').optional().trim().isLength({ min: 2, max: 140 }),
    body('countryCode').optional().isString().trim().isLength({ min: 2, max: 2 }),
  ],
  contabilAuthController.registerFirmGoogle,
);

router.post(
  '/register-client-invite',
  firmLoginLimiter,
  requireTurnstile({ action: TURNSTILE_ACTIONS.REGISTER_CLIENT_INVITE }),
  [
    body('token').isString().trim().isLength({ min: 16, max: 128 }),
    emailField(),
    body('password').isString().isLength({ min: 10 }),
    body('fullName').isString().trim().isLength({ min: 2, max: 140 }),
  ],
  contabilAuthController.registerClientInvite
);

router.post('/refresh', refreshLimiter, contabilAuthController.refresh);
router.post('/logout', contabilAuthController.logout);
router.get('/me', authMiddleware, contabilAuthController.me);
router.post('/complete-onboarding', authMiddleware, contabilAuthController.completeOnboarding);

router.post(
  '/recover',
  recoverLimiter,
  requireTurnstile({ action: TURNSTILE_ACTIONS.RECOVER }),
  [emailField(), body('role').optional().isString().trim()],
  contabilAuthController.recoverPassword
);

router.post(
  '/validate-reset-token',
  recoverLimiter,
  [body('token').isString().trim().isLength({ min: 16, max: 128 })],
  contabilAuthController.validateResetToken
);

const resetValidators = [
  body('token').isString().trim().isLength({ min: 16, max: 128 }),
  body('newPassword').isString().isLength({ min: 10 }),
];

router.post(
  '/reset',
  recoverLimiter,
  requireTurnstile({ action: TURNSTILE_ACTIONS.RESET_PASSWORD }),
  resetValidators,
  contabilAuthController.resetPassword,
);
router.post(
  '/reset-password',
  recoverLimiter,
  requireTurnstile({ action: TURNSTILE_ACTIONS.RESET_PASSWORD }),
  resetValidators,
  contabilAuthController.resetPassword,
);

const googleSsoController = require('../modules/auth/google/google-sso.controller');
router.get('/sso/status', googleSsoController.ssoStatus);
router.get('/google/pending', googleSsoController.getPendingRegistration);
router.get('/google', googleSsoController.startGoogleLogin);
router.get('/google/callback', googleSsoController.googleCallback);

router.get('/mfa/challenge/status', mfaVerifyLimiter, mfaController.challengeStatus);
router.post(
  '/mfa/challenge/verify',
  mfaVerifyLimiter,
  mfaController.challengeVerifyValidators,
  mfaController.challengeVerify,
);
router.post(
  '/mfa/enroll/begin',
  optionalAuthIfNoMfaChallenge,
  mfaEnrollLimiter,
  mfaController.enrollBegin,
);
router.post(
  '/mfa/enroll/confirm',
  optionalAuthIfNoMfaChallenge,
  mfaEnrollLimiter,
  mfaController.enrollConfirmValidators,
  mfaController.enrollConfirm,
);
router.get('/mfa/status', authMiddleware, mfaController.sessionStatus);
router.post(
  '/mfa/disable',
  authMiddleware,
  mfaVerifyLimiter,
  mfaController.disableValidators,
  mfaController.disable,
);
router.post(
  '/mfa/recovery/regenerate',
  authMiddleware,
  mfaVerifyLimiter,
  mfaController.regenerateValidators,
  mfaController.regenerateRecovery,
);

module.exports = router;
