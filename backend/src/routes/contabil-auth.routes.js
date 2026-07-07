const express = require('express');
const { body } = require('express-validator');
const contabilAuthController = require('../modules/auth/contabil-auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  firmLoginLimiter,
  recoverLimiter,
  refreshLimiter,
  registerFirmLimiter,
} = require('../utils/auth-rate-limit');

const router = express.Router();

const loginFirmValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 1 }),
  body('rememberMe').optional().isBoolean(),
];

const loginClientValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 1 }),
  body('rememberMe').optional().isBoolean(),
  body('firmSlug').optional().isString().trim().isLength({ min: 2, max: 64 }),
];

router.post('/login-firm', firmLoginLimiter, loginFirmValidators, contabilAuthController.loginFirm);

router.post('/login-client', firmLoginLimiter, loginClientValidators, contabilAuthController.loginClient);

router.post(
  '/register-firm',
  registerFirmLimiter,
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
  [
    body('token').isString().trim().isLength({ min: 16, max: 128 }),
    body('email').isEmail().normalizeEmail(),
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
  [body('email').isEmail().normalizeEmail(), body('role').optional().isString().trim()],
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

router.post('/reset', recoverLimiter, resetValidators, contabilAuthController.resetPassword);
router.post('/reset-password', recoverLimiter, resetValidators, contabilAuthController.resetPassword);

const googleSsoController = require('../modules/auth/google/google-sso.controller');
router.get('/sso/status', googleSsoController.ssoStatus);
router.get('/google/pending', googleSsoController.getPendingRegistration);
router.get('/google', googleSsoController.startGoogleLogin);
router.get('/google/callback', googleSsoController.googleCallback);

module.exports = router;
