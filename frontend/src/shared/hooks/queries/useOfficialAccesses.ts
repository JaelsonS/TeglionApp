import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { contabilClientsApi } from '@/infrastructure/api'
import type {
  OfficialAccessesResponse,
  OfficialAccessItem,
  OfficialAccessRevealResponse,
  OfficialPortalKey,
} from '@/features/firm/client-hub/officialAccesses.types'
import { getErrorMessage } from '@/shared/utils/errors'

export const officialAccessesQueryKey = (clientId: string) =>
  ['client-official-accesses', clientId] as const

export function useOfficialAccesses(clientId: string | undefined) {
  return useQuery({
    queryKey: officialAccessesQueryKey(clientId || ''),
    queryFn: () => contabilClientsApi.listOfficialAccesses(clientId!) as Promise<OfficialAccessesResponse>,
    enabled: Boolean(clientId),
    staleTime: 20_000,
  })
}

export function useUpsertOfficialAccess(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      currentPassword: string
      portalKey: OfficialPortalKey
      accessId?: string | null
      username?: string | null
      password?: string
      label?: string | null
    }) => contabilClientsApi.upsertOfficialAccess(clientId, payload) as Promise<{ item: OfficialAccessItem }>,
    onSuccess: () => {
      toast.success('Acesso oficial guardado')
      void queryClient.invalidateQueries({ queryKey: officialAccessesQueryKey(clientId) })
    },
    onError: (err) => {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    },
  })
}

export function useRevealOfficialAccess(clientId: string) {
  return useMutation({
    mutationFn: (payload: { accessId: string; currentPassword: string }) =>
      contabilClientsApi.revealOfficialAccess(clientId, payload.accessId, {
        currentPassword: payload.currentPassword,
      }) as Promise<OfficialAccessRevealResponse>,
    onError: (err) => {
      toast.error('Não foi possível mostrar a senha', { description: getErrorMessage(err) })
    },
  })
}

export function useRemoveOfficialAccess(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { accessId: string; currentPassword: string }) =>
      contabilClientsApi.removeOfficialAccess(clientId, payload.accessId, {
        currentPassword: payload.currentPassword,
      }),
    onSuccess: () => {
      toast.success('Acesso oficial removido')
      void queryClient.invalidateQueries({ queryKey: officialAccessesQueryKey(clientId) })
    },
    onError: (err) => {
      toast.error('Não foi possível remover', { description: getErrorMessage(err) })
    },
  })
}
