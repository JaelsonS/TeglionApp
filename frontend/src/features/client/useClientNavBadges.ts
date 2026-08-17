import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import type { ClientNavBadges } from '@/features/client/clientPortalNav'
import { clientPortalContabilApi } from '@/infrastructure/api'
import { useClientPortalBellCount } from '@/shared/hooks/useClientPortalBellCount'
import { useLiveEventsContext } from '@/shared/providers/LiveEventsProvider'
import { onAppDataChanged } from '@/shared/utils/appEvents'

export function useClientNavBadges(enabled = true): ClientNavBadges {
  const location = useLocation()
  const live = useLiveEventsContext()
  const { unreadAlerts, unreadNews } = useClientPortalBellCount(enabled)
  const [pendingRequests, setPendingRequests] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  const refresh = useCallback(async () => {
    if (!enabled) return
    try {
      const [reqRes, msgRes] = await Promise.all([
        clientPortalContabilApi.listDocumentRequests(),
        clientPortalContabilApi.getMessagesUnreadCount(),
      ])
      const pending = ((reqRes.items || []) as Array<{ status?: string }>).filter(
        (r) => String(r.status || '').toLowerCase() === 'pending',
      ).length
      setPendingRequests(pending)
      setUnreadMessages(msgRes.total ?? 0)
    } catch {
      setPendingRequests(0)
      setUnreadMessages(0)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    void refresh()
  }, [enabled, refresh, location.pathname])

  useEffect(() => {
    if (!enabled) return
    if (live.badge?.messages != null) void refresh()
  }, [enabled, live.badge?.messages, refresh])

  useEffect(() => {
    if (!enabled) return
    return onAppDataChanged((d) => {
      if (
        !d.scope ||
        d.scope === 'messages' ||
        d.scope === 'document-requests' ||
        d.scope === 'documents' ||
        d.scope === 'live'
      ) {
        void refresh()
      }
    })
  }, [enabled, refresh])

  return {
    requests: pendingRequests,
    messages: unreadMessages,
    updates: unreadAlerts + unreadNews,
  }
}
