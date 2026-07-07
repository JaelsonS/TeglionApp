const express = require('express');
const { body } = require('express-validator');
const { requireCronSecret } = require('../../middlewares/cron-secret.middleware');
const automationController = require('../../modules/automations/automation.controller');
const contabilAuthController = require('../../modules/auth/contabil-auth.controller');
const integrationsHealthController = require('../../modules/public/integrations-health.controller');
const { registerFirmLimiter } = require('../../utils/auth-rate-limit');

const router = express.Router();

router.post('/automations/run-all', requireCronSecret, automationController.runAllFirms);
router.get('/health/integrations', requireCronSecret, integrationsHealthController.getIntegrationsHealth);
router.post(
  '/automations/cron/run',
  requireCronSecret,
  [body('firmId').isUUID()],
  automationController.runCronForFirm,
);

/** @deprecated Use POST /api/auth/register-firm — mantido para compatibilidade. */
router.post(
  '/auth/register-firm',
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

module.exports = router;
