/**
 * Contadores do nav do escritório — UMA query agregada (`/contabil/nav-badges`).
 * Polling lento (3 min) + invalidação via live events. Não montar hooks por badge
 * em cada nav (sidebar/tablet/mobile): usar `useFirmNavBadgeCounts` (RQ dedupe).
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { useAuth } from '@/shared/hooks/useAuth'
import { onAppDataChanged } from '@/shared/utils/appEvents'
import { isQueriesPausedByRateLimit } from '@/shared/utils/rate-limit-backoff'
import { contabilNavBadgesApi } from '@/infrastructure/api'
import type { FirmNavItemConfig } from '@/features/firm/firmNavConfig'

/** Intervalo de poll do chrome — deliberadamente alto para não esgotar rate limit. */
export const FIRM_NAV_BADGES_POLL_MS = 180_000
export const FIRM_NAV_BADGES_STALE_MS = 60_000

export const FIRM_NAV_BADGES_QUERY_KEY = 'firm-nav-badges' as const
/** Compat: páginas que ainda invalidam o unseen antigo. */
export const FIRM_INQUIRIES_UNSEEN_QUERY_KEY = ['contabil-service-inquiries', 'unseen-count'] as const
export const FIRM_MESSAGES_UNREAD_KEY = 'firm-messages-unread'

const EMPTY_COUNTS = {
  messages: 0,
  serviceInquiries: 0,
  consultations: 0,
  documents: 0,
  tasks: 0,
  obligations: 0,
}

function visiblePollInterval(ms: number | false) {
  return (q: { state: { error: unknown } }) => {
    if (document.visibilityState !== 'visible') return false
    if (isQueriesPausedByRateLimit()) return false
    if (isAxiosError(q.state.error) && q.state.error.response?.status === 429) return false
    return ms
  }
}

function retryUnless429(failureCount: number, error: unknown) {
  if (isAxiosError(error) && error.response?.status === 429) return false
  return failureCount < 1
}

export type FirmNavBadgeCounts = {
  messages: number
  serviceInquiries: number
  consultations: number
  documents: number
  tasks: number
  obligations: number
}

export function useFirmNavBadgeCounts(): FirmNavBadgeCounts {
  const { user } = useAuth()
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: [FIRM_NAV_BADGES_QUERY_KEY, user?.id],
    queryFn: () => contabilNavBadgesApi.get(),
    enabled: Boolean(user?.id),
    staleTime: FIRM_NAV_BADGES_STALE_MS,
    refetchInterval: visiblePollInterval(FIRM_NAV_BADGES_POLL_MS),
    retry: retryUnless429,
  })

  useEffect(() => {
    if (!user?.id) return
    return onAppDataChanged((detail) => {
      if (
        !detail.scope ||
        detail.scope === 'live' ||
        detail.scope === 'messages' ||
        detail.scope === 'internal-messages' ||
        detail.scope === 'document-requests' ||
        detail.scope === 'service-inquiries'
      ) {
        void qc.invalidateQueries({ queryKey: [FIRM_NAV_BADGES_QUERY_KEY, user.id] })
      }
    })
  }, [qc, user?.id])

  return query.data ?? EMPTY_COUNTS
}

/** Compat — páginas que só precisam do unseen de pedidos de serviço. */
export function useFirmServiceInquiriesUnseen() {
  return useFirmNavBadgeCounts().serviceInquiries
}

/** Compat — unread de mensagens via agregado. */
export function useFirmMessagesUnread() {
  return useFirmNavBadgeCounts().messages
}

export function resolveFirmNavBadge(item: FirmNavItemConfig, counts: FirmNavBadgeCounts): number | undefined {
  switch (item.badgeKey) {
    case 'messages':
      return counts.messages
    case 'serviceInquiries':
      return counts.serviceInquiries
    case 'consultations':
      return counts.consultations
    case 'documents':
      return counts.documents
    case 'tasks':
      return counts.tasks
    case 'obligations':
      return counts.obligations
    default:
      return undefined
  }
}
