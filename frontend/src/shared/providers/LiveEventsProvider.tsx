import { createContext, useContext, type ReactNode } from 'react'

import { useAppPollingScheduler } from '@/shared/hooks/useAppPollingScheduler'
import { useLiveEvents, type LiveBadge } from '@/shared/hooks/useLiveEvents'

const LiveEventsContext = createContext<{ badge?: LiveBadge; forceRefresh: () => void }>({
  forceRefresh: () => {},
})

export function LiveEventsProvider({
  scope,
  children,
  enabled = true,
}: {
  scope: 'firm' | 'client'
  children: ReactNode
  enabled?: boolean
}) {
  useAppPollingScheduler(enabled ? scope : 'off')
  const { badge, forceRefresh } = useLiveEvents(scope, enabled)
  return <LiveEventsContext.Provider value={{ badge, forceRefresh }}>{children}</LiveEventsContext.Provider>
}

export function useLiveEventsContext() {
  return useContext(LiveEventsContext)
}
