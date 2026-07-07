const express = require('express');
const billingController = require('../../modules/billing/billing.controller');
const { requireFirmOwner } = require('../../middlewares/firm-owner.middleware');

const router = express.Router();

router.get('/billing/status', billingController.getStatus);
router.post('/billing/checkout', requireFirmOwner, billingController.createCheckout);
router.post('/billing/portal', requireFirmOwner, billingController.createPortal);

module.exports = router;
