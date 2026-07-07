import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/shared/hooks/useAuth'
import { contabilDocumentsApi } from '@/infrastructure/api'
import { queryKeys } from '@/shared/hooks/queries/queryKeys'
import { isFirmSessionUser } from '@/shared/utils/authNormalize'
import type { DocumentRequest } from '@/shared/types/contabil'
import type { MessageThread } from '@/shared/types/contabil'
import type { Client } from '@/shared/types/clients'

export type FirmInboxData = {
  threads: MessageThread[]
  requests: Array<DocumentRequest & { clientName?: string }>
  unread: { total: number; threadsWithUnread: number }
  clients: Client[]
}

type InboxFilters = {
  clientId?: string
  status?: string
  enabled?: boolean
}

export function useFirmInbox(filters: InboxFilters = {}) {
  const { user } = useAuth()
  const tenantSlug = user?.tenant.slug ?? ''

  return useQuery({
    queryKey: queryKeys.firmInbox(tenantSlug, {
      clientId: filters.clientId,
      status: filters.status,
    }),
    queryFn: () =>
      contabilDocumentsApi.getInbox({
        clientId: filters.clientId,
        status: filters.status,
      }) as Promise<FirmInboxData>,
    enabled: isFirmSessionUser(user) && Boolean(tenantSlug) && (filters.enabled ?? true),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
