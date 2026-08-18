import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { contabilClientsApi } from '@/infrastructure/api'
import type {
  OfficialAccessesResponse,
  OfficialAccessItem,
  OfficialAccessRevealResponse,
  OfficialPortalKey,
} from '@/features/firm/client-hub/officialAccesses.types'
import type { VaultUnlockPayload, VaultStepUpResponse } from '@/features/firm/client-hub/vaultStepUpSession'

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
    mutationFn: (
      payload: VaultUnlockPayload & {
        portalKey: OfficialPortalKey
        accessId?: string | null
        username?: string | null
        password?: string
        label?: string | null
      },
    ) =>
      contabilClientsApi.upsertOfficialAccess(clientId, payload) as Promise<
        { item: OfficialAccessItem } & VaultStepUpResponse
      >,
    onSuccess: () => {
      toast.success('Acesso oficial guardado')
      void queryClient.invalidateQueries({ queryKey: officialAccessesQueryKey(clientId) })
    },
  })
}

export function useRevealOfficialAccess(clientId: string) {
  return useMutation({
    mutationFn: (payload: VaultUnlockPayload & { accessId: string }) =>
      contabilClientsApi.revealOfficialAccess(clientId, payload.accessId, {
        currentPassword: payload.currentPassword,
        stepUpToken: payload.stepUpToken,
        rememberSession: payload.rememberSession,
      }) as Promise<OfficialAccessRevealResponse>,
  })
}

export function useRemoveOfficialAccess(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: VaultUnlockPayload & { accessId: string }) =>
      contabilClientsApi.removeOfficialAccess(clientId, payload.accessId, {
        currentPassword: payload.currentPassword,
        stepUpToken: payload.stepUpToken,
        rememberSession: payload.rememberSession,
      }) as Promise<{ removed: boolean; accessId: string } & VaultStepUpResponse>,
    onSuccess: () => {
      toast.success('Acesso oficial removido')
      void queryClient.invalidateQueries({ queryKey: officialAccessesQueryKey(clientId) })
    },
  })
}
