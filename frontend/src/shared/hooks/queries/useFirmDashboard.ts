import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/shared/hooks/useAuth'
import { contabilFirmApi } from '@/infrastructure/api'
import { queryKeys } from '@/shared/hooks/queries/queryKeys'
import { isFirmSessionUser } from '@/shared/utils/authNormalize'
import type { FirmContabilDashboard } from '@/shared/types/contabil'

export function useFirmDashboard(enabled = true) {
  const { user } = useAuth()
  const tenantSlug = user?.tenant.slug ?? ''

  return useQuery({
    queryKey: queryKeys.firmDashboard(tenantSlug),
    queryFn: () => contabilFirmApi.getDashboard() as Promise<FirmContabilDashboard>,
    enabled: isFirmSessionUser(user) && Boolean(tenantSlug) && enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
