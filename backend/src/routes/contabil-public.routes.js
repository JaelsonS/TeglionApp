/**
 * Rotas públicas Teglion.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');
const invitesController = require('../modules/firm/invites.controller');
const teamInvitesController = require('../modules/firm/team-invites.controller');
const postalLookupController = require('../modules/public/postal-lookup.controller');
const legalController = require('../modules/legal/legal.controller');
const firmBrandingPublic = require('../modules/public/firm-branding-public.controller');
const blogNewsletterController = require('../modules/public/blog-newsletter.controller');
const integrationsHealthController = require('../modules/public/integrations-health.controller');
const countriesController = require('../modules/public/countries.controller');
const pricingController = require('../modules/public/pricing.controller');
const supportController = require('../modules/public/support.controller');
const serviceIntakeController = require('../modules/public/service-intake-public.controller');
const { createRateLimitStore } = require('../utils/rate-limit-store');
const { uploadSingle } = require('../middlewares/upload.middleware');

const router = express.Router();

const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  store: createRateLimitStore('rl:newsletter:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMIT', message: 'Demasiados pedidos. Tente novamente mais tarde.' },
});

const supportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  store: createRateLimitStore('rl:support:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMIT', message: 'Demasiados pedidos. Tente novamente mais tarde.' },
});

const invitePreviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  store: createRateLimitStore('rl:invite-preview:'),
  standardHeaders: true,
  legacyHeaders: false,
});

const serviceViewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  store: createRateLimitStore('rl:service-view:'),
  standardHeaders: true,
  legacyHeaders: false,
});

const serviceSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  store: createRateLimitStore('rl:service-submit:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMIT', message: 'Demasiados pedidos. Tente novamente mais tarde.' },
});

const intakePortalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  store: createRateLimitStore('rl:intake-portal:'),
  standardHeaders: true,
  legacyHeaders: false,
});

const intakeUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  store: createRateLimitStore('rl:intake-upload:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMIT', message: 'Demasiados envios. Tente novamente mais tarde.' },
});

router.get('/health', (_req, res) => res.json({ ok: true, service: 'contabil-public' }));

router.get('/health/integrations', (req, res, next) => {
  if (env.isProduction) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Rota não encontrada' });
  }
  return integrationsHealthController.getIntegrationsHealth(req, res, next);
});

router.get('/legal/versions', legalController.getVersions);
router.get('/countries', countriesController.getSupportedCountries);
router.get('/pricing', pricingController.getPublicPricing);
router.get('/postal-lookup', postalLookupController.lookup);
router.get('/client-invite/:token', invitePreviewLimiter, invitesController.previewPublic);
router.get('/team-invite/:token', invitePreviewLimiter, teamInvitesController.previewPublic);
router.post('/team-invite/:token/accept', invitePreviewLimiter, teamInvitesController.acceptPublic);
router.get('/team-email-confirm/:token', invitePreviewLimiter, teamInvitesController.confirmEmailPublic);
router.get('/team/invites/:token', invitePreviewLimiter, teamInvitesController.previewPublic);
router.post('/team/invites/:token/accept', invitePreviewLimiter, teamInvitesController.acceptPublic);
router.get('/team/email-confirm/:token', invitePreviewLimiter, teamInvitesController.confirmEmailPublic);
router.get('/firm-branding', firmBrandingPublic.validators, firmBrandingPublic.getBySlug);
router.post('/blog/newsletter', newsletterLimiter, blogNewsletterController.subscribe);
router.post('/support', supportLimiter, supportController.submit);

router.get(
  '/firms/:firmSlug/services',
  serviceViewLimiter,
  serviceIntakeController.getFirmServicesValidators,
  serviceIntakeController.getPublicFirmServices,
);
router.get(
  '/firms/:firmSlug/site',
  serviceViewLimiter,
  serviceIntakeController.getFirmSiteValidators,
  serviceIntakeController.getPublicFirmSite,
);
router.get(
  '/firms/:firmSlug/services/:serviceSlug',
  serviceViewLimiter,
  serviceIntakeController.getServiceValidators,
  serviceIntakeController.getPublicService,
);
router.get(
  '/firms/:firmSlug/services/:serviceSlug/slots',
  serviceViewLimiter,
  serviceIntakeController.slotsValidators,
  serviceIntakeController.getPublicSlots,
);
router.post(
  '/firms/:firmSlug/services/:serviceSlug/submit',
  serviceSubmitLimiter,
  serviceIntakeController.submitValidators,
  serviceIntakeController.submitIntake,
);
router.get(
  '/service-inquiries/:token',
  intakePortalLimiter,
  serviceIntakeController.tokenValidators,
  serviceIntakeController.getByToken,
);
router.post(
  '/service-inquiries/:token/documents',
  intakeUploadLimiter,
  uploadSingle('file'),
  serviceIntakeController.tokenValidators,
  serviceIntakeController.uploadByToken,
);
router.post(
  '/service-inquiries/:token/requests/:requestId/reply',
  intakeUploadLimiter,
  serviceIntakeController.replyValidators,
  serviceIntakeController.submitReply,
);

module.exports = router;
