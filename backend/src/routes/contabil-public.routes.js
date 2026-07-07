/**
 * Rotas públicas TegLion.
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
const { createRateLimitStore } = require('../utils/rate-limit-store');

const router = express.Router();

const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  store: createRateLimitStore('rl:newsletter:'),
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

router.get('/health', (_req, res) => res.json({ ok: true, service: 'contabil-public' }));

router.get('/health/integrations', (req, res, next) => {
  if (env.isProduction) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Rota não encontrada' });
  }
  return integrationsHealthController.getIntegrationsHealth(req, res, next);
});

router.get('/legal/versions', legalController.getVersions);
router.get('/countries', countriesController.getSupportedCountries);
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

module.exports = router;
