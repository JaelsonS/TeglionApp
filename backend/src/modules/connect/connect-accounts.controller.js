const connectAccountsService = require('./connect-accounts.service');
const connectWebhookService = require('./connect-webhook.service');
const { env } = require('../../config/env');
const { getStripe, isStripeConnectWebhookConfigured } = require('../../services/stripe/stripe-client');
const { clientIp, clientUserAgent } = require('../../utils/client-ip');
const { logger } = require('../../utils/logger');

function isOwnerUser(req) {
  return req.user?.role === 'FIRM_OWNER' || req.firmUserRecord?.role === 'FIRM_OWNER';
}

exports.getStatus = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await connectAccountsService.getConnectStatus(firmId, {
      isOwner: isOwnerUser(req),
    });
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.startOnboarding = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await connectAccountsService.startOnboarding({
      firmId,
      ownerUserId: String(req.user.id),
      ownerEmail: req.user.email || null,
      ownerRole: req.firmUserRecord?.role || req.user.role,
      acceptedConnectTerms: req.body?.acceptedConnectTerms === true,
      ipAddress: clientIp(req),
      userAgent: clientUserAgent(req),
    });
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.refreshOnboarding = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await connectAccountsService.refreshOnboardingLink({
      firmId,
      ownerUserId: String(req.user.id),
      ownerRole: req.firmUserRecord?.role || req.user.role,
      ipAddress: clientIp(req),
    });
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.handleWebhook = async (req, res) => {
  if (!isStripeConnectWebhookConfigured()) {
    return res.status(503).json({ error: 'Stripe Connect webhook not configured' });
  }

  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      env.STRIPE_CONNECT_WEBHOOK_SECRET,
    );
  } catch (err) {
    logger.warn('[connect] webhook signature failed', { message: err.message });
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    await connectWebhookService.handleConnectWebhookEvent(event);
    return res.status(200).json({ received: true });
  } catch (err) {
    logger.error('[connect] webhook handler error', { message: err.message, type: event.type });
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
};
