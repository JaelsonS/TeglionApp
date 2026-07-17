const billingService = require('./billing.service');
const { env } = require('../../config/env');
const { getStripe } = require('../../services/stripe/stripe-client');
const { logger } = require('../../utils/logger');

exports.getStatus = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await billingService.getBillingStatus(firmId);
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.createCheckout = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const intervalRaw = String(req.body?.interval || req.query?.interval || 'month').toLowerCase();
    const interval = intervalRaw === 'year' || intervalRaw === 'yearly' || intervalRaw === 'anual' ? 'year' : 'month';
    const data = await billingService.createCheckoutSession(firmId, req.user.email, { interval });
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.createPortal = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const data = await billingService.createPortalSession(firmId);
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.handleWebhook = async (req, res) => {
  const stripe = getStripe();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Stripe webhook not configured' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn('[billing] webhook signature failed', { message: err.message });
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    await billingService.handleWebhookEvent(event);
    return res.status(200).json({ received: true });
  } catch (err) {
    logger.error('[billing] webhook handler error', { message: err.message, type: event.type });
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
};
