/**
 * Teglion Control Center — rotas internas AfDigital.
 */
const express = require('express');
const { query } = require('express-validator');
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
  ],
  platformOpsController.firms,
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
  ],
  platformOpsController.loginAttempts,
);

module.exports = router;
