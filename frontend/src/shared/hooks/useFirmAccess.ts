import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { BILLING_STATUS_QUERY_KEY, type BillingStatus } from '@/infrastructure/api/contabil/billing'
import { contabilBillingApi } from '@/infrastructure/api'
import { readBillingStatusCache, writeBillingStatusCache } from '@/shared/utils/billingStatusCache'

export type FirmAccessStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'PAST_DUE' | 'CANCELED' | 'CANCELLED' | null

/** Valida acesso do escritório via API autenticada (tenant no JWT). */
export function useFirmAccess(enabled = true) {
  const cached = readBillingStatusCache()

  const query = useQuery({
    queryKey: BILLING_STATUS_QUERY_KEY,
    queryFn: async () => {
      const data = (await contabilBillingApi.getStatus()) as BillingStatus
      writeBillingStatusCache(data)
      return data
    },
    enabled,
    placeholderData: cached,
    initialData: cached,
    staleTime: 120_000,
    refetchInterval: (q) => {
      if (document.visibilityState !== 'visible') return false
      if (isAxiosError(q.state.error) && q.state.error.response?.status === 429) return false
      return 5 * 60_000
    },
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 429) return false
      return failureCount < 1
    },
  })

  const status = (query.data?.status as FirmAccessStatus) || null
  const trialEndsAt = query.data?.trialEndsAt ? new Date(query.data.trialEndsAt) : null
  const now = new Date()
  const trialActive = status === 'TRIAL' && (!trialEndsAt || trialEndsAt > now)
  const hasAccess = status === 'ACTIVE' || trialActive

  return {
    status,
    isLoading: query.isLoading,
    hasAccess,
    trialEndsAt,
    trialActive,
  }
}
