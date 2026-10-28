/**
 * Teglion Control Center — rotas internas AfDigital.
 */
const express = require('express');
const { body, param, query } = require('express-validator');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { requirePlatformOps } = require('../middlewares/platform-ops.middleware');
const platformOpsController = require('../modules/platform-ops/platform-ops.controller');

const router = express.Router();

router.use(authMiddleware, requirePlatformOps);

router.get('/me', platformOpsController.me);
router.get('/overview', platformOpsController.overview);
router.get(
  '/firms',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('q').optional().isString().trim().isLength({ max: 120 }),
    query('status').optional().isString().trim().isLength({ max: 32 }),
  ],
  platformOpsController.firms,
);
router.get(
  '/firms/:firmId',
  [param('firmId').isUUID()],
  platformOpsController.firmDetail,
);
router.post(
  '/firms/:firmId/suspend',
  [param('firmId').isUUID()],
  platformOpsController.suspendFirm,
);
router.post(
  '/firms/:firmId/reactivate',
  [param('firmId').isUUID()],
  platformOpsController.reactivateFirm,
);
router.post(
  '/firms/:firmId/extend-trial',
  [
    param('firmId').isUUID(),
    body('days').optional().isInt({ min: 1, max: 365 }),
    body('trialEndsAt').optional().isISO8601(),
  ],
  platformOpsController.extendFirmTrial,
);
router.post(
  '/firms/:firmId/cancel',
  [
    param('firmId').isUUID(),
    body('confirmName').isString().trim().isLength({ min: 1, max: 200 }),
  ],
  platformOpsController.cancelFirm,
);
router.get(
  '/sentry/issues',
  [query('limit').optional().isInt({ min: 1, max: 50 })],
  platformOpsController.sentryIssues,
);
router.get(
  '/ip-denylist',
  [
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('offset').optional().isInt({ min: 0 }),
    query('includeRevoked').optional().isIn(['0', '1', 'true', 'false']),
  ],
  platformOpsController.listIpDenylist,
);
router.post(
  '/ip-denylist',
  [
    body('ip').isString().trim().isLength({ min: 3, max: 64 }),
    body('reason').optional().isString().trim().isLength({ max: 280 }),
  ],
  platformOpsController.addIpDenylist,
);
router.post(
  '/ip-denylist/revoke',
  [
    body('id').optional().isUUID(),
    body('ip').optional().isString().trim().isLength({ min: 3, max: 64 }),
  ],
  platformOpsController.revokeIpDenylist,
);
router.get('/security-lab/signals', platformOpsController.securityLabSignals);
router.post(
  '/security-lab/signal',
  [
    body('code').isString().trim().isLength({ min: 3, max: 64 }),
    body('note').optional().isString().trim().isLength({ max: 280 }),
  ],
  platformOpsController.securityLabEmit,
);
router.get(
  '/audit-logs',
  [
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('offset').optional().isInt({ min: 0 }),
    query('action').optional().isString().trim().isLength({ max: 120 }),
    query('firmId').optional().isUUID(),
    query('since').optional().isISO8601(),
  ],
  platformOpsController.auditLogs,
);
router.get(
  '/login-attempts',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('lockedOnly').optional().isIn(['0', '1', 'true', 'false']),
  ],
  platformOpsController.loginAttempts,
);
router.post(
  '/login-attempts/clear-lockout',
  [body('accountKey').isString().trim().isLength({ min: 3, max: 320 })],
  platformOpsController.clearLockout,
);
router.get(
  '/export/:kind',
  [param('kind').isIn(['firms', 'audit', 'logins'])],
  platformOpsController.exportCsv,
);

module.exports = router;
