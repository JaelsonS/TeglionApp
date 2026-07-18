const test = require('node:test');
const assert = require('node:assert/strict');

const { getPricingPlans, TRIAL_DAYS } = require('./pricing-plans');
const { env } = require('./env');

test('getPricingPlans deriva equivalentMonthlyCents de yearlyCents/12 (nunca hardcoded)', () => {
  const plans = getPricingPlans('PT');
  assert.equal(plans.currency, 'EUR');
  assert.equal(plans.trialDays, TRIAL_DAYS);
  assert.equal(plans.monthly.amountCents, env.FIRM_PLAN_EUR_MONTHLY_CENTS);
  assert.equal(plans.yearly.amountCents, env.FIRM_PLAN_EUR_YEARLY_CENTS);
  assert.equal(plans.yearly.equivalentMonthlyCents, Math.round(env.FIRM_PLAN_EUR_YEARLY_CENTS / 12));
});

test('getPricingPlans mantém equivalentMonthlyCents sincronizado se yearlyCents mudar', () => {
  const original = env.FIRM_PLAN_EUR_YEARLY_CENTS;
  try {
    env.FIRM_PLAN_EUR_YEARLY_CENTS = 60000; // simula alteração de preço anual
    const plans = getPricingPlans('PT');
    assert.equal(plans.yearly.equivalentMonthlyCents, 5000);
  } finally {
    env.FIRM_PLAN_EUR_YEARLY_CENTS = original;
  }
});
