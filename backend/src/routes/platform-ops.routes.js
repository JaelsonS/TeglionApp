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
