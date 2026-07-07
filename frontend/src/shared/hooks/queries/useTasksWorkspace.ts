import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { tasksApi, type WorkspaceTask } from '@/infrastructure/api/contabil/tasks'

export const tasksWorkspaceKeys = {
  all: ['tasks-workspace'] as const,
  list: (params: Record<string, string | undefined>) => [...tasksWorkspaceKeys.all, 'list', params] as const,
  metrics: () => [...tasksWorkspaceKeys.all, 'metrics'] as const,
  detail: (id: string) => [...tasksWorkspaceKeys.all, 'detail', id] as const,
}

export type TaskMetricFilter = 'active' | 'overdue' | 'critical' | 'waiting_client' | ''

export function useTasksWorkspace(params: {
  search?: string
  status?: string
  clientId?: string
  priority?: string
  metric?: TaskMetricFilter
  includeArchived?: boolean
}) {
  const qParams: Record<string, string | undefined> = {
    search: params.search,
    status: params.status,
    clientId: params.clientId,
    priority: params.priority,
    metric: params.metric || undefined,
    includeArchived: params.includeArchived ? 'true' : undefined,
    limit: '200',
  }
  return useQuery({
    queryKey: tasksWorkspaceKeys.list(qParams),
    queryFn: () => tasksApi.listWorkspace(qParams),
    staleTime: 30_000,
  })
}

export function useTaskMetrics() {
  return useQuery({
    queryKey: tasksWorkspaceKeys.metrics(),
    queryFn: () => tasksApi.getMetrics(),
    staleTime: 60_000,
  })
}

export function useTaskDetail(taskId: string | null) {
  return useQuery({
    queryKey: tasksWorkspaceKeys.detail(taskId || ''),
    queryFn: () => tasksApi.getDetail(taskId!),
    enabled: Boolean(taskId),
  })
}

export function usePatchTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) => tasksApi.patch(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: tasksWorkspaceKeys.all })
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ payload, file }: { payload: Record<string, unknown>; file?: File | null }) =>
      tasksApi.create(payload, file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: tasksWorkspaceKeys.all })
    },
  })
}

export function useTaskComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => tasksApi.addComment(id, body),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: tasksWorkspaceKeys.detail(vars.id) })
      void qc.invalidateQueries({ queryKey: tasksWorkspaceKeys.all })
    },
  })
}

export function optimisticMoveTask(items: WorkspaceTask[], taskId: string, status: WorkspaceTask['status']) {
  return items.map((t) => (t.id === taskId ? { ...t, status } : t))
}
