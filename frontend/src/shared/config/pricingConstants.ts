/**
 * Constantes de preço puras (sem dependências de rede/React Query), para serem
 * usadas por texto estático (i18n) e pelo hook `usePublicPricing` sem criar
 * import cíclico. Ver `pricingPlans.ts` para a versão "viva" (busca `/public/pricing`).
 *
 * Devem espelhar `backend/src/config/env.js`
 * (`FIRM_PLAN_EUR_MONTHLY_CENTS` / `FIRM_PLAN_EUR_YEARLY_CENTS`).
 */
export const PRICING_FALLBACK = {
  currency: 'EUR' as const,
  trialDays: 14,
  monthly: { interval: 'month' as const, amountCents: 3500, configured: true },
  yearly: { interval: 'year' as const, amountCents: 35988, equivalentMonthlyCents: 2999, configured: true },
}

export function formatEurCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export const PRICING_TEXT = {
  trialDays: PRICING_FALLBACK.trialDays,
  monthlyLabel: formatEurCents(PRICING_FALLBACK.monthly.amountCents),
  yearlyMonthlyLabel: formatEurCents(PRICING_FALLBACK.yearly.equivalentMonthlyCents),
  yearlyTotalLabel: formatEurCents(PRICING_FALLBACK.yearly.amountCents),
}
