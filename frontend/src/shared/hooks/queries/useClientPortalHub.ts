import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/shared/hooks/useAuth'
import { clientPortalContabilApi } from '@/infrastructure/api'
import { queryKeys } from '@/shared/hooks/queries/queryKeys'
import type { ContabilHubSummary } from '@/shared/types/contabil'

/** Hub do portal do cliente (não confundir com `useClientHub` do escritório). */
export function useClientPortalHub(enabled = true) {
  const { user } = useAuth()
  const clientId = user?.clientId || user?.id || ''

  return useQuery({
    queryKey: queryKeys.clientPortalHub(clientId),
    queryFn: () => clientPortalContabilApi.getHub() as Promise<ContabilHubSummary>,
    enabled: Boolean(clientId) && enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
