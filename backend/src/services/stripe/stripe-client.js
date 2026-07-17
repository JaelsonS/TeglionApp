const Stripe = require('stripe');
const { env } = require('../../config/env');

let stripeSingleton = null;

function getStripe() {
  if (!env.STRIPE_SECRET_KEY) return null;
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripeSingleton;
}

/**
 * @param {string} [countryCode]
 * @param {'month'|'year'} [interval]
 */
function resolveSubscriptionPriceId(countryCode = 'PT', interval = 'month') {
  const cc = String(countryCode || 'PT').toUpperCase();
  const billingInterval = interval === 'year' ? 'year' : 'month';

  if (cc === 'BR' && env.STRIPE_PRICE_ID_BRL) return env.STRIPE_PRICE_ID_BRL;
  if (cc === 'US' && env.STRIPE_PRICE_ID_USD) return env.STRIPE_PRICE_ID_USD;

  if (billingInterval === 'year') {
    return env.STRIPE_PRICE_ID_EUR_YEARLY || null;
  }

  return (
    env.STRIPE_PRICE_ID_EUR_MONTHLY ||
    env.STRIPE_PRICE_ID_EUR ||
    env.STRIPE_PRICE_ID ||
    null
  );
}

function isStripeConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY && resolveSubscriptionPriceId('PT', 'month'));
}

module.exports = { getStripe, isStripeConfigured, resolveSubscriptionPriceId };
