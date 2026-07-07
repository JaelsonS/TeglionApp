import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchClientHub, patchClient } from '@/infrastructure/api/contabil/clientHub'
import { contabilQueryKeys } from '@/infrastructure/api/contabil/queryKeys'
import type { ClientFiscalProfile, ClientHubResponse } from '@/infrastructure/api/contabil/types'
import { getErrorMessage } from '@/shared/utils/errors'

export function useClientHub(clientId: string | undefined) {
  return useQuery({
    queryKey: contabilQueryKeys.clients.hub(clientId || ''),
    queryFn: () => fetchClientHub(clientId!),
    enabled: Boolean(clientId),
    staleTime: 45_000,
  })
}

export function usePatchClient(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Parameters<typeof patchClient>[1]) => patchClient(clientId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData<ClientHubResponse>(
        contabilQueryKeys.clients.hub(clientId),
        (prev) =>
          prev
            ? {
                ...prev,
                client: { ...prev.client, ...data.client },
              }
            : prev,
      )
      window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: contabilQueryKeys.clients.hub(clientId) })
      }, 500)
    },
    onError: (err) => {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    },
  })
}

export type ClientPatchPayload = {
  displayName?: string
  email?: string | null
  phone?: string | null
  taxId?: string | null
  assignedStaffId?: string | null
  metadata?: Partial<ClientFiscalProfile>
}
