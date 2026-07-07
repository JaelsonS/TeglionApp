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

function isStripeConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY && resolveSubscriptionPriceId());
}

function resolveSubscriptionPriceId(countryCode = 'PT') {
  const cc = String(countryCode || 'PT').toUpperCase();
  if (cc === 'BR' && env.STRIPE_PRICE_ID_BRL) return env.STRIPE_PRICE_ID_BRL;
  if (cc === 'US' && env.STRIPE_PRICE_ID_USD) return env.STRIPE_PRICE_ID_USD;
  return env.STRIPE_PRICE_ID_EUR || env.STRIPE_PRICE_ID || null;
}

module.exports = { getStripe, isStripeConfigured, resolveSubscriptionPriceId };
