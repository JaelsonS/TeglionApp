const express = require('express');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { requireActiveFirm } = require('../../middlewares/firm-access.middleware');
const { contabilModeGuard } = require('./middleware');
const cronRoutes = require('./cron.routes');
const billingRoutes = require('./billing.routes');
const firmDomainRoutes = require('./firm-domain.routes');

const router = express.Router();

router.use(contabilModeGuard);
router.use(cronRoutes);
router.use(authMiddleware);
router.use(billingRoutes);
router.use(requireActiveFirm);
router.use(firmDomainRoutes);

module.exports = router;
