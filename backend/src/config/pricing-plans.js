/**
 * Fonte única de verdade para preços do plano "Escritório".
 *
 * Todos os números de preço exibidos ao utilizador (Landing Page, página de
 * preços pública, Dashboard/Billing) DEVEM vir daqui — directa ou indirectamente
 * via `GET /contabil/public/pricing` (marketing, sem sessão) ou
 * `GET /contabil/billing/status` (dashboard, autenticado). Nunca voltar a
 * escrever `35`, `359,88`, `29,99` ou `14 dias` directamente em componentes.
 *
 * A base é `env.FIRM_PLAN_EUR_MONTHLY_CENTS` / `FIRM_PLAN_EUR_YEARLY_CENTS`
 * (configuráveis no Render). O valor mensal-equivalente do plano anual é
 * SEMPRE derivado (yearlyCents / 12), nunca hardcoded, para não desalinhar
 * se o preço anual mudar.
 */
const { env } = require('./env');
const { resolveSubscriptionPriceId } = require('../services/stripe/stripe-client');

const TRIAL_DAYS = Number(process.env.FIRM_TRIAL_DAYS || 14);
const CURRENCY = 'EUR';

/**
 * @param {string} [countryCode]
 * @returns {{
 *   currency: string,
 *   trialDays: number,
 *   monthly: { interval: 'month', amountCents: number, configured: boolean },
 *   yearly: { interval: 'year', amountCents: number, equivalentMonthlyCents: number, configured: boolean },
 * }}
 */
function getPricingPlans(countryCode = 'PT') {
  const monthlyPriceId = resolveSubscriptionPriceId(countryCode, 'month');
  const yearlyPriceId = resolveSubscriptionPriceId(countryCode, 'year');
  const monthlyCents = env.FIRM_PLAN_EUR_MONTHLY_CENTS;
  const yearlyCents = env.FIRM_PLAN_EUR_YEARLY_CENTS;

  return {
    currency: CURRENCY,
    trialDays: TRIAL_DAYS,
    monthly: {
      interval: 'month',
      amountCents: monthlyCents,
      configured: Boolean(monthlyPriceId),
    },
    yearly: {
      interval: 'year',
      amountCents: yearlyCents,
      equivalentMonthlyCents: Math.round(yearlyCents / 12),
      configured: Boolean(yearlyPriceId),
    },
  };
}

module.exports = { getPricingPlans, TRIAL_DAYS, CURRENCY };
