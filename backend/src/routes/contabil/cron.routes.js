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

// A rota POST /auth/register-firm que existia aqui (duplicada, @deprecated) foi removida em
// 20/08/2026 — auditoria de segurança confirmou que (a) não tinha proteção Turnstile, ao
// contrário da rota canônica em contabil-auth.routes.js, permitindo criação de contas em
// massa por bot contornando o CAPTCHA; e (b) não há nenhuma chamada real a ela no frontend
// (confirmado por busca exaustiva — o frontend só usa POST /api/auth/register-firm).
// Reduz superfície de ataque sem perda de funcionalidade.

module.exports = router;
