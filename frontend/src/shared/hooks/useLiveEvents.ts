import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'

import { api } from '@/infrastructure/api'
import { emitAppDataChanged } from '@/shared/utils/appEvents'

export type LiveBadge = {
  messages: number
  notifications: number
  total: number
}

export type LivePollResult = {
  events: Array<{ type: string; category?: string }>
  cursor: string
  badge: LiveBadge
}

async function pollFirm(since?: string) {
  return api
    .get('/contabil/live/events', { params: since ? { since } : undefined })
    .then((r) => r.data as LivePollResult)
}

async function pollClient(since?: string) {
  return api
    .get('/client-portal/me/contabil/live/events', { params: since ? { since } : undefined })
    .then((r) => r.data as LivePollResult)
}

function setAppBadge(count: number) {
  if ('setAppBadge' in navigator) {
    void (navigator as Navigator & { setAppBadge: (n: number) => Promise<void> })
      .setAppBadge(count > 0 ? count : 0)
      .catch(() => {})
  }
}

export function useLiveEvents(scope: 'firm' | 'client', enabled = true) {
  const qc = useQueryClient()
  const cursorRef = useRef<string | undefined>(undefined)

  const query = useQuery({
    queryKey: ['live-events', scope],
    queryFn: () => (scope === 'firm' ? pollFirm(cursorRef.current) : pollClient(cursorRef.current)),
    enabled,
    refetchInterval: false,
    staleTime: 30_000,
  })

  useEffect(() => {
    const data = query.data
    if (!data) return
    cursorRef.current = data.cursor
    setAppBadge(data.badge?.total ?? 0)

    if (data.events?.length) {
      void qc.invalidateQueries({ queryKey: ['firm-notifications'] })
      void qc.invalidateQueries({ queryKey: ['tasks-workspace'] })
      emitAppDataChanged({ scope: 'live', types: data.events.map((e) => e.type) })
    }
  }, [query.data, qc])

  const forceRefresh = useCallback(() => {
    cursorRef.current = undefined
    void query.refetch()
  }, [query])

  return { badge: query.data?.badge, events: query.data?.events ?? [], forceRefresh, isPolling: query.isFetching }
}
