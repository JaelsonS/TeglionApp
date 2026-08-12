const express = require('express');
const connectController = require('../../modules/connect/connect-accounts.controller');
const { requireFirmOwner } = require('../../middlewares/firm-owner.middleware');

const router = express.Router();

/** Estado Connect — qualquer staff autenticado do escritório pode ver. */
router.get('/connect/status', connectController.getStatus);

/** Onboarding / refresh — apenas FIRM_OWNER + aceite de política. */
router.post('/connect/onboarding-link', requireFirmOwner, connectController.startOnboarding);
router.post('/connect/refresh-link', requireFirmOwner, connectController.refreshOnboarding);

module.exports = router;
