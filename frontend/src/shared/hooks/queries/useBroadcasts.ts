import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchBroadcastsMeta, fetchFirmBroadcasts } from '@/infrastructure/api/contabil/broadcasts'
import { contabilQueryKeys } from '@/infrastructure/api/contabil/queryKeys'
import { contabilBroadcastsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { toast } from 'sonner'

export const broadcastQueryKeys = {
  meta: ['contabil', 'broadcasts', 'meta'] as const,
  list: (filters: string) => ['contabil', 'broadcasts', 'list', filters] as const,
  analytics: (id: string) => ['contabil', 'broadcasts', 'analytics', id] as const,
  clientFeed: (filters: string) => ['contabil', 'alerts', 'client', filters] as const,
}

export function useBroadcastsMeta() {
  return useQuery({
    queryKey: broadcastQueryKeys.meta,
    queryFn: fetchBroadcastsMeta,
    staleTime: 5 * 60_000,
  })
}

export function useFirmBroadcasts(filters: {
  status?: string
  category?: string
  priority?: string
  search?: string
}) {
  const key = JSON.stringify(filters)
  return useQuery({
    queryKey: broadcastQueryKeys.list(key),
    queryFn: () => fetchFirmBroadcasts({ ...filters, page: 1, limit: 50 }),
    staleTime: 30_000,
  })
}

export function useBroadcastMutations() {
  const qc = useQueryClient()
  const invalidate = () => void qc.invalidateQueries({ queryKey: ['contabil', 'broadcasts'] })

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) => contabilBroadcastsApi.create(payload),
    onSuccess: () => {
      toast.success('Alerta criado')
      invalidate()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      contabilBroadcastsApi.update(id, payload),
    onSuccess: () => {
      toast.success('Alerta actualizado')
      invalidate()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const remove = useMutation({
    mutationFn: (id: string) => contabilBroadcastsApi.remove(id),
    onSuccess: () => {
      toast.success('Alerta removido')
      invalidate()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  return { create, update, remove }
}
