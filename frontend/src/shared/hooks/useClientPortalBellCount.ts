import { useQuery } from '@tanstack/react-query'

import { fetchClientAlerts } from '@/infrastructure/api/contabil/broadcasts'
import { broadcastQueryKeys } from '@/shared/hooks/queries/useBroadcasts'
import { useClientNewsFeed } from '@/shared/hooks/useClientNews'
import { clientPortalContabilApi } from '@/infrastructure/api'
import type { PortalNotification } from '@/shared/types/portal'

/** Contador global do sino: alertas + notificações API + notícias (localStorage). */
export function useClientPortalBellCount(enabled = true) {
  const { unreadCount: unreadNews } = useClientNewsFeed(enabled)

  const { data: alerts } = useQuery({
    queryKey: broadcastQueryKeys.clientFeed('bell'),
    queryFn: () => fetchClientAlerts(),
    staleTime: 45_000,
    refetchInterval: 60_000,
    enabled,
  })

  const { data: notifs } = useQuery({
    queryKey: ['contabil', 'notifications', 'portal'],
    queryFn: () =>
      clientPortalContabilApi.listNotifications() as Promise<{ items?: PortalNotification[] }>,
    staleTime: 45_000,
    refetchInterval: 60_000,
    enabled,
  })

  const unreadAlerts = alerts?.unreadCount || 0
  const unreadNotifs = (notifs?.items || []).filter((n) => !n.readAt).length
  const total = unreadAlerts + unreadNotifs + unreadNews

  return { unreadAlerts, unreadNotifs, unreadNews, total, notifications: notifs?.items || [] }
}
