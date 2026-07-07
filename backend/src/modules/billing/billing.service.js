const { AppError } = require('../../middlewares/error.middleware');
const { env } = require('../../config/env');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const stripeWebhookEventsRepository = require('../../db/supabase/repositories/stripe-webhook-events.repository');
const { getStripe, isStripeConfigured, resolveSubscriptionPriceId } = require('../../services/stripe/stripe-client');
const { logger } = require('../../utils/logger');

const BILLING_PLAN_OFFICE = 'office_monthly';

const { computeFirmAccess, mapSubscriptionStatusToFirm } = require('./billing-access');

async function getBillingStatus(firmId) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);
  const access = computeFirmAccess(firm);
  return {
    status: firm.status,
    trialEndsAt: firm.trialEndsAt,
    billingPlan: firm.billingPlan,
    hasAccess: access.hasAccess,
    accessReason: access.reason,
    stripeConfigured: isStripeConfigured(),
    stripeCustomerId: firm.stripeCustomerId || null,
    hasSubscription: Boolean(firm.stripeSubscriptionId),
    priceEurCents: env.FIRM_PLAN_EUR_CENTS,
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

async function createCheckoutSession(firmId, actorEmail) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);

  const stripe = getStripe();
  const priceId = resolveSubscriptionPriceId(firm.countryCode);
  if (!stripe || !priceId) {
    throw new AppError('Stripe não configurado. Defina STRIPE_SECRET_KEY e STRIPE_PRICE_ID_EUR.', 503, undefined, 'STRIPE_NOT_CONFIGURED');
  }

  const customer = await getOrCreateStripeCustomer(firm);
  const base = env.FRONTEND_URL.replace(/\/+$/, '');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    client_reference_id: firm.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/app/firm/billing?checkout=success`,
    cancel_url: `${base}/app/firm/billing?checkout=cancelled`,
    subscription_data: {
      metadata: { firmId: firm.id, product: 'teglion' },
    },
    metadata: { firmId: firm.id, product: 'teglion' },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    customer_update: { name: 'auto', address: 'auto' },
  });

  return { url: session.url, sessionId: session.id };
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
  await firmsRepository.updateStripeIds(firmId, {
    stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
    stripeSubscriptionId: subscription.id,
    status,
    billingPlan: status === 'ACTIVE' ? BILLING_PLAN_OFFICE : undefined,
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
