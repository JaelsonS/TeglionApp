const { AppError } = require('../../middlewares/error.middleware');
const { env } = require('../../config/env');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const stripeWebhookEventsRepository = require('../../db/supabase/repositories/stripe-webhook-events.repository');
const { getStripe, isStripeConfigured, resolveSubscriptionPriceId } = require('../../services/stripe/stripe-client');
const { getPricingPlans } = require('../../config/pricing-plans');
const { logger } = require('../../utils/logger');

const BILLING_PLAN_OFFICE_MONTHLY = 'office_monthly';
const BILLING_PLAN_OFFICE_YEARLY = 'office_yearly';

const { computeFirmAccess, mapSubscriptionStatusToFirm } = require('./billing-access');

async function getBillingStatus(firmId) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);
  const access = computeFirmAccess(firm);
  // Fonte única de verdade dos preços — ver backend/src/config/pricing-plans.js.
  const plans = getPricingPlans(firm.countryCode);
  return {
    status: firm.status,
    trialEndsAt: firm.trialEndsAt,
    billingPlan: firm.billingPlan,
    hasAccess: access.hasAccess,
    accessReason: access.reason,
    stripeConfigured: isStripeConfigured(),
    stripeCustomerId: firm.stripeCustomerId || null,
    hasSubscription: Boolean(firm.stripeSubscriptionId),
    priceEurCents: plans.monthly.amountCents,
    trialDays: plans.trialDays,
    plans: {
      monthly: plans.monthly,
      yearly: plans.yearly,
    },
  };
}

async function getOrCreateStripeCustomer(firm) {
  const stripe = getStripe();
  if (!stripe) throw new AppError('Pagamentos não configurados no servidor', 503, undefined, 'STRIPE_NOT_CONFIGURED');

  if (firm.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(firm.stripeCustomerId);
      if (!existing.deleted) return existing;
    } catch {
      // recria abaixo
    }
  }

  const customer = await stripe.customers.create({
    name: firm.name,
    metadata: { firmId: firm.id, product: 'teglion' },
  });
  await firmsRepository.updateStripeIds(firm.id, {
    stripeCustomerId: customer.id,
  });
  return customer;
}

async function createCheckoutSession(firmId, actorEmail, { interval = 'month' } = {}) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);

  const billingInterval = interval === 'year' ? 'year' : 'month';
  const stripe = getStripe();
  const priceId = resolveSubscriptionPriceId(firm.countryCode, billingInterval);
  if (!stripe || !priceId) {
    throw new AppError(
      billingInterval === 'year'
        ? 'Plano anual ainda não está configurado.'
        : 'Stripe não configurado.',
      503,
      undefined,
      'STRIPE_NOT_CONFIGURED',
    );
  }

  const customer = await getOrCreateStripeCustomer(firm);
  const base = env.FRONTEND_URL.replace(/\/+$/, '');
  const planKey = billingInterval === 'year' ? BILLING_PLAN_OFFICE_YEARLY : BILLING_PLAN_OFFICE_MONTHLY;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    client_reference_id: firm.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/app/firm/billing?checkout=success`,
    cancel_url: `${base}/app/firm/billing?checkout=cancelled`,
    subscription_data: {
      metadata: { firmId: firm.id, product: 'teglion', plan: planKey, interval: billingInterval },
    },
    metadata: { firmId: firm.id, product: 'teglion', plan: planKey, interval: billingInterval },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    customer_update: { name: 'auto', address: 'auto' },
  });

  return { url: session.url, sessionId: session.id, interval: billingInterval };
}

async function createPortalSession(firmId) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);
  if (!firm.stripeCustomerId) {
    throw new AppError('Ainda não existe subscrição Stripe. Active o plano primeiro.', 400, undefined, 'NO_STRIPE_CUSTOMER');
  }

  const stripe = getStripe();
  if (!stripe) throw new AppError('Stripe não configurado', 503, undefined, 'STRIPE_NOT_CONFIGURED');

  const base = env.FRONTEND_URL.replace(/\/+$/, '');
  const portal = await stripe.billingPortal.sessions.create({
    customer: firm.stripeCustomerId,
    return_url: `${base}/app/firm/billing`,
  });
  return { url: portal.url };
}

async function applySubscriptionToFirm(firmId, subscription) {
  const status = mapSubscriptionStatusToFirm(subscription.status);
  const planFromMeta = subscription.metadata?.plan;
  const intervalFromMeta = subscription.metadata?.interval;
  const billingPlan =
    status === 'ACTIVE'
      ? planFromMeta ||
        (intervalFromMeta === 'year' ? BILLING_PLAN_OFFICE_YEARLY : BILLING_PLAN_OFFICE_MONTHLY)
      : undefined;
  await firmsRepository.updateStripeIds(firmId, {
    stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
    stripeSubscriptionId: subscription.id,
    status,
    billingPlan,
  });
  logger.info('[billing] subscription synced', { firmId, subStatus: subscription.status, firmStatus: status });
}

async function handleWebhookEvent(event) {
  const stripe = getStripe();
  if (!stripe) return;

  const claimed = await stripeWebhookEventsRepository.claimWebhookEvent(event.id, event.type);
  if (!claimed) return;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.mode !== 'subscription') break;
      const firmId = session.metadata?.firmId || session.client_reference_id;
      const subId = session.subscription;
      if (!firmId || !subId) break;
      const subscription = await stripe.subscriptions.retrieve(String(subId));
      await applySubscriptionToFirm(String(firmId), subscription);
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const firmId = subscription.metadata?.firmId;
      let firm = firmId ? await firmsRepository.findFirmById(String(firmId)) : null;
      if (!firm) {
        firm = await firmsRepository.findFirmByStripeCustomerId(
          typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
        );
      }
      if (!firm) {
        logger.warn('[billing] subscription event sem firm', { subId: subscription.id });
        break;
      }
      if (event.type === 'customer.subscription.deleted') {
        await firmsRepository.updateStripeIds(firm.id, {
          stripeSubscriptionId: null,
          status: 'SUSPENDED',
        });
        break;
      }
      await applySubscriptionToFirm(firm.id, subscription);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      const firm = await firmsRepository.findFirmByStripeCustomerId(customerId);
      if (firm) {
        await firmsRepository.setFirmStatus(firm.id, 'SUSPENDED');
      }
      break;
    }
    default:
      break;
  }
}

module.exports = {
  computeFirmAccess,
  getBillingStatus,
  createCheckoutSession,
  createPortalSession,
  handleWebhookEvent,
};
