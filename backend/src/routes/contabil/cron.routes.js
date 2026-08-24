const express = require('express');
const { body } = require('express-validator');
const { requireCronSecret } = require('../../middlewares/cron-secret.middleware');
const automationController = require('../../modules/automations/automation.controller');
const integrationsHealthController = require('../../modules/public/integrations-health.controller');

const router = express.Router();

router.post('/automations/run-all', requireCronSecret, automationController.runAllFirms);
router.get('/health/integrations', requireCronSecret, integrationsHealthController.getIntegrationsHealth);
router.post(
  '/automations/cron/run',
  requireCronSecret,
  [body('firmId').isUUID()],
  automationController.runCronForFirm,
);

module.exports = router;
