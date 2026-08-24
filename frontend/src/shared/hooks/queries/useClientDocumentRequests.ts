import { useQuery } from '@tanstack/react-query'

import { clientPortalContabilApi } from '@/infrastructure/api'
import { useAuth } from '@/shared/hooks/useAuth'
import { queryKeys } from '@/shared/hooks/queries/queryKeys'
import type { DocumentRequest } from '@/shared/types/contabil'

/**
 * Pedidos de documento do cliente autenticado — partilhado entre o dashboard,
 * a agenda, os badges de navegação e o painel de pedidos, para evitar quatro
 * GET /client-portal/me/contabil/document-requests independentes na mesma sessão.
 */
export function useClientDocumentRequests(enabled = true) {
  const { user } = useAuth()
  const clientId = user?.clientId || user?.id || ''

  return useQuery({
    queryKey: queryKeys.clientDocumentRequests(clientId),
    queryFn: () => clientPortalContabilApi.listDocumentRequests() as Promise<{ items: DocumentRequest[] }>,
    enabled: Boolean(clientId) && enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
