import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  fetchClientActivityHistory,
  fetchClientHub,
  hideAllClientFeedActivity,
  hideClientActivity,
  patchClient,
  unhideClientActivity,
  type ActivityHistoryParams,
} from '@/infrastructure/api/contabil/clientHub'
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

export function useClientActivityHistory(
  clientId: string | undefined,
  filters: ActivityHistoryParams,
  enabled = true,
) {
  return useQuery({
    queryKey: ['client-activity-history', clientId, filters],
    queryFn: () => fetchClientActivityHistory(clientId!, filters),
    enabled: Boolean(clientId) && enabled,
    staleTime: 20_000,
  })
}

export function useHideClientActivity(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (activityId: string) => hideClientActivity(clientId, activityId),
    onSuccess: (_data, activityId) => {
      queryClient.setQueryData<ClientHubResponse>(
        contabilQueryKeys.clients.hub(clientId),
        (prev) =>
          prev
            ? {
                ...prev,
                timeline: prev.timeline.filter(
                  (item) => item.activityId !== activityId && item.id !== `activity-${activityId}`,
                ),
              }
            : prev,
      )
      toast.success('Ocultada do feed', {
        description: 'Fica no Histórico e pode ser restaurada.',
      })
      void queryClient.invalidateQueries({ queryKey: contabilQueryKeys.clients.hub(clientId) })
      void queryClient.invalidateQueries({ queryKey: ['client-activity-history', clientId] })
    },
    onError: (err) => {
      toast.error('Não foi possível ocultar', { description: getErrorMessage(err) })
    },
  })
}

export function useUnhideClientActivity(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (activityId: string) => unhideClientActivity(clientId, activityId),
    onSuccess: () => {
      toast.success('Restaurada no feed')
      void queryClient.invalidateQueries({ queryKey: contabilQueryKeys.clients.hub(clientId) })
      void queryClient.invalidateQueries({ queryKey: ['client-activity-history', clientId] })
    },
    onError: (err) => {
      toast.error('Não foi possível restaurar', { description: getErrorMessage(err) })
    },
  })
}

export function useHideAllClientFeedActivity(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => hideAllClientFeedActivity(clientId),
    onSuccess: (data) => {
      queryClient.setQueryData<ClientHubResponse>(
        contabilQueryKeys.clients.hub(clientId),
        (prev) => (prev ? { ...prev, timeline: [] } : prev),
      )
      toast.success(
        data.hidden > 0
          ? `${data.hidden} entrada(s) ocultada(s) do feed`
          : 'O feed já estava limpo',
      )
      void queryClient.invalidateQueries({ queryKey: contabilQueryKeys.clients.hub(clientId) })
      void queryClient.invalidateQueries({ queryKey: ['client-activity-history', clientId] })
    },
    onError: (err) => {
      toast.error('Não foi possível limpar o feed', { description: getErrorMessage(err) })
    },
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
