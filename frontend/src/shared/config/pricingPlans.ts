/**
 * Fonte única de verdade (frontend) para os preços do plano "Escritório".
 *
 * Em runtime, `usePublicPricing()` busca `/public/pricing` (sem autenticação)
 * e sobrepõe o fallback estático (`pricingConstants.ts`) com os valores reais
 * configurados no servidor — se o preço mudar no Render, todas as páginas
 * (Landing, Preços, Dashboard/Billing) reflectem automaticamente, sem precisar
 * de deploy do frontend.
 *
 * NUNCA volte a escrever "35 €", "359,88 €", "29,99 €" ou "14 dias" directamente
 * num componente — importe e formate a partir daqui.
 */
import { useQuery } from '@tanstack/react-query'

import { contabilPublicApi } from '@/infrastructure/api'
import type { PublicPricingPlans } from '@/infrastructure/api/contabil/public'
import { PRICING_FALLBACK, formatEurCents } from '@/shared/config/pricingConstants'

export { PRICING_FALLBACK, formatEurCents } from '@/shared/config/pricingConstants'

export function usePublicPricing() {
  const query = useQuery({
    queryKey: ['public-pricing'],
    queryFn: () => contabilPublicApi.getPricing(),
    staleTime: 5 * 60_000,
    // A Landing Page não pode ficar sem preço nem "saltar" visualmente: usamos o
    // fallback como valor inicial e deixamos o React Query substituir em segundo plano.
    placeholderData: PRICING_FALLBACK as PublicPricingPlans,
  })

  const plans = query.data ?? PRICING_FALLBACK

  return {
    ...query,
    plans,
    trialDays: plans.trialDays,
    monthlyLabel: formatEurCents(plans.monthly.amountCents),
    yearlyMonthlyLabel: formatEurCents(plans.yearly.equivalentMonthlyCents),
    yearlyTotalLabel: formatEurCents(plans.yearly.amountCents),
  }
}
