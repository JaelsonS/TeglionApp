import { useQuery } from '@tanstack/react-query'

import { contabilClientsApi } from '@/infrastructure/api'
import { useAuth } from '@/shared/hooks/useAuth'
import { queryKeys } from '@/shared/hooks/queries/queryKeys'
import { isFirmSessionUser } from '@/shared/utils/authNormalize'
import type { Client } from '@/shared/types/clients'

export type FirmClientsDirectoryParams = {
  limit?: number
  includeInactive?: boolean
  enabled?: boolean
}

/**
 * Lista de clientes do escritório partilhada entre workspaces.
 * A queryKey inclui o slug do tenant da sessão (nunca um tenantId enviado pelo UI).
 */
export function useFirmClientsDirectory(params: FirmClientsDirectoryParams = {}) {
  const { user } = useAuth()
  const tenantSlug = user?.tenant.slug ?? ''
  const limit = params.limit ?? 500
  const includeInactive = Boolean(params.includeInactive)

  return useQuery({
    queryKey: queryKeys.firmClientsDirectory(tenantSlug, { limit, includeInactive }),
    queryFn: () =>
      contabilClientsApi.list({
        page: 1,
        limit,
        includeInactive: includeInactive ? '1' : undefined,
      }) as Promise<{ items?: Client[]; total?: number }>,
    enabled: (params.enabled ?? true) && isFirmSessionUser(user) && Boolean(tenantSlug),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
