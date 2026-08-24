import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'

import type { ClientNavBadges } from '@/features/client/clientPortalNav'
import { clientPortalContabilApi } from '@/infrastructure/api'
import { useClientDocumentRequests } from '@/shared/hooks/queries/useClientDocumentRequests'
import { queryKeys } from '@/shared/hooks/queries/queryKeys'
import { useClientPortalBellCount } from '@/shared/hooks/useClientPortalBellCount'
import { useLiveEventsContext } from '@/shared/providers/LiveEventsProvider'
import { onAppDataChanged } from '@/shared/utils/appEvents'

export function useClientNavBadges(enabled = true): ClientNavBadges {
  const location = useLocation()
  const live = useLiveEventsContext()
  const qc = useQueryClient()
  const { unreadAlerts, unreadNews } = useClientPortalBellCount(enabled)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Pedidos de documento agora vêm da cache partilhada (ver ClientDocumentRequestsPanel,
  // ClientDashboardPage e ClientObligationsPage) — este hook deixou de fazer o próprio
  // GET /document-requests independente a cada troca de rota.
  const requestsQuery = useClientDocumentRequests(enabled)
  const pendingRequests = useMemo(
    () =>
      (requestsQuery.data?.items || []).filter(
        (r) => String(r.status || '').toLowerCase() === 'pending',
      ).length,
    [requestsQuery.data?.items],
  )

  const refreshMessages = useCallback(async () => {
    if (!enabled) return
    try {
      const msgRes = await clientPortalContabilApi.getMessagesUnreadCount()
      setUnreadMessages(msgRes.total ?? 0)
    } catch {
      setUnreadMessages(0)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    void refreshMessages()
  }, [enabled, refreshMessages, location.pathname])

  useEffect(() => {
    if (!enabled) return
    if (live.badge?.messages != null) void refreshMessages()
  }, [enabled, live.badge?.messages, refreshMessages])

  useEffect(() => {
    if (!enabled) return
    return onAppDataChanged((d) => {
      if (!d.scope || d.scope === 'document-requests' || d.scope === 'documents' || d.scope === 'live') {
        void qc.invalidateQueries({ queryKey: queryKeys.clientDocumentRequestsRoot })
      }
      if (!d.scope || d.scope === 'messages' || d.scope === 'live') {
        void refreshMessages()
      }
    })
  }, [enabled, qc, refreshMessages])

  return {
    requests: pendingRequests,
    messages: unreadMessages,
    updates: unreadAlerts + unreadNews,
  }
}
