import { QueryClient, type Query } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { getRateLimitBackoffMs, pauseQueriesAfterRateLimit } from '@/shared/utils/rate-limit-backoff'

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false
  if (isAxiosError(error)) {
    const status = error.response?.status
    if (status === 429 || status === 401 || status === 403 || status === 404) return false
  }
  return true
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
})

/** Após 429, pausa refetches automáticos (sem invalidar tudo de uma vez). */
export function registerQueryRateLimitGuard(client: QueryClient): void {
  client.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated') return
    const query = event.query as Query
    const err = query.state.error
    if (!isAxiosError(err) || err.response?.status !== 429) return
    const backoff = getRateLimitBackoffMs(err, 90_000)
    query.cancel({ silent: true })
    pauseQueriesAfterRateLimit(backoff)
  })
}

registerQueryRateLimitGuard(queryClient)
