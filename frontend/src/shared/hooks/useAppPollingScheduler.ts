import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/shared/hooks/queries/queryKeys'
import { useAuth } from '@/shared/hooks/useAuth'
import { isQueriesPausedByRateLimit } from '@/shared/utils/rate-limit-backoff'

const POLL_MS = 120_000
const FOCUS_DEBOUNCE_MS = 3_000

/**
 * Um único scheduler por shell (firm/client) invalida caches em vez de N intervals.
 */
export function useAppPollingScheduler(scope: 'firm' | 'client' | 'off') {
  const qc = useQueryClient()
  const { user } = useAuth()
  const tenantSlug = user?.tenant.slug ?? ''
  const clientId = user?.clientId || user?.id || ''
  const lastTickRef = useRef(0)

  useEffect(() => {
    if (scope === 'off') return

    const tick = () => {
      if (document.visibilityState !== 'visible') return
      if (isQueriesPausedByRateLimit()) return

      const now = Date.now()
      if (now - lastTickRef.current < FOCUS_DEBOUNCE_MS) return
      lastTickRef.current = now

      void qc.invalidateQueries({ queryKey: queryKeys.liveEvents(scope) })
      if (scope === 'firm' && tenantSlug) {
        void qc.invalidateQueries({ queryKey: ['firm-inbox', tenantSlug] })
        void qc.invalidateQueries({ queryKey: queryKeys.firmDashboard(tenantSlug) })
      }
      if (scope === 'client' && clientId) {
        void qc.invalidateQueries({ queryKey: queryKeys.clientPortalHub(clientId) })
        void qc.invalidateQueries({ queryKey: ['contabil', 'notifications', 'portal'] })
        void qc.invalidateQueries({ queryKey: ['client-news'] })
        void qc.invalidateQueries({ queryKey: ['client-messages'] })
        void qc.invalidateQueries({ queryKey: ['client-document-requests'] })
      }
    }

    const id = window.setInterval(tick, POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [scope, qc, tenantSlug, clientId])
}
