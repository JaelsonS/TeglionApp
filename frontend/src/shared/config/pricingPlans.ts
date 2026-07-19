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
 *
 * Propositadamente SEM React Query: este hook é usado nas páginas públicas
 * (Landing, /pricing), que não montam o QueryProvider (é um provider "pesado",
 * só carregado em /app e /auth — ver AuthenticatedAppShell.tsx). Usar useQuery
 * aqui rebentava com "No QueryClient set" nessas páginas.
 */
import { useEffect, useState } from 'react'

import { contabilPublicApi } from '@/infrastructure/api'
import type { PublicPricingPlans } from '@/infrastructure/api/contabil/public'
import { PRICING_FALLBACK, formatEurCents } from '@/shared/config/pricingConstants'

export { PRICING_FALLBACK, formatEurCents } from '@/shared/config/pricingConstants'

const STALE_TIME_MS = 5 * 60_000

let cachedPlans: PublicPricingPlans | null = null
let cachedAt = 0
let inFlight: Promise<PublicPricingPlans> | null = null

function fetchPricing(): Promise<PublicPricingPlans> {
  if (cachedPlans && Date.now() - cachedAt < STALE_TIME_MS) {
    return Promise.resolve(cachedPlans)
  }
  if (!inFlight) {
    inFlight = contabilPublicApi
      .getPricing()
      .then((data) => {
        cachedPlans = data
        cachedAt = Date.now()
        return data
      })
      .finally(() => {
        inFlight = null
      })
  }
  return inFlight
}

export function usePublicPricing() {
  const [plans, setPlans] = useState<PublicPricingPlans>(cachedPlans ?? (PRICING_FALLBACK as PublicPricingPlans))

  useEffect(() => {
    let active = true
    fetchPricing()
      .then((data) => {
        if (active) setPlans(data)
      })
      .catch(() => {
        // Mantém o fallback estático em caso de falha de rede — a página
        // nunca fica sem preço, só não recebe a actualização do servidor.
      })
    return () => {
      active = false
    }
  }, [])

  return {
    plans,
    trialDays: plans.trialDays,
    monthlyLabel: formatEurCents(plans.monthly.amountCents),
    yearlyMonthlyLabel: formatEurCents(plans.yearly.equivalentMonthlyCents),
    yearlyTotalLabel: formatEurCents(plans.yearly.amountCents),
  }
}
