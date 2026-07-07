import { api } from '@/infrastructure/api'

export type WorkspaceTaskStatus =
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'WAITING_CLIENT'
  | 'REVIEW'
  | 'DONE'
  | 'ARCHIVED'

export type WorkspaceTask = {
  id: string
  _id: string
  clientId: string
  clientName?: string | null
  title: string
  description?: string | null
  status: WorkspaceTaskStatus
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  dueDate?: string | null
  isOverdue?: boolean
  assigneeId?: string | null
  tags?: string[]
  helpRequestedAt?: string | null
  dependsOnTaskId?: string | null
  obligationId?: string | null
  obligationTitle?: string | null
  taskType?: 'recurring_obligation' | 'manual_task'
  periodMonth?: string | null
  recurringRuleId?: string | null
  createdAt?: string
  updatedAt?: string
}

export type TaskTimelineItem = {
  id: string
  kind?: string
  title?: string
  description?: string | null
  actorRole?: string
  actorName?: string | null
  createdAt?: string
}

export type TaskLinkedDocument = {
  id: string
  _id: string
  title?: string
  mimeType?: string
  category?: string
  validationStatus?: string
  createdAt?: string
  uploadedByRole?: string
}

export type TaskDetailResponse = {
  task: WorkspaceTask & { clientEmail?: string; clientTaxId?: string }
  comments: TaskComment[]
  timeline?: TaskTimelineItem[]
  documents?: TaskLinkedDocument[]
  obligation?: { id: string; title?: string; period?: string; status?: string } | null
}

export type TaskMetrics = {
  total: number
  active: number
  overdue: number
  critical: number
  waitingClient: number
  done: number
  byStatus: Record<string, number>
  avgClientResponseHours?: number | null
  byAssignee?: { assigneeId: string; count: number }[]
  topClients?: { clientId: string; count: number }[]
}

export type TaskComment = {
  id: string
  authorRole: 'FIRM' | 'CLIENT'
  authorName?: string
  body: string
  createdAt: string
}

export const tasksApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get('/contabil/client-tasks', { params }).then((r) => r.data),

  listWorkspace: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get('/contabil/client-tasks/workspace', { params }).then((r) => r.data as { items: WorkspaceTask[]; total: number }),

  getMetrics: () => api.get('/contabil/client-tasks/metrics').then((r) => r.data as TaskMetrics),

  getDetail: (id: string) =>
    api.get(`/contabil/client-tasks/${encodeURIComponent(id)}`).then((r) => r.data as TaskDetailResponse),

  attachFile: (id: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post(`/contabil/client-tasks/${encodeURIComponent(id)}/attach`, fd).then((r) => r.data)
  },

  create: (payload: Record<string, unknown>, file?: File | null) => {
    if (file) {
      const fd = new FormData()
      for (const [k, v] of Object.entries(payload)) {
        if (v != null && v !== '') fd.append(k, String(v))
      }
      fd.append('file', file)
      return api.post('/contabil/client-tasks', fd).then((r) => r.data)
    }
    return api.post('/contabil/client-tasks', payload).then((r) => r.data)
  },

  patch: (id: string, payload: Record<string, unknown>) =>
    api.patch(`/contabil/client-tasks/${encodeURIComponent(id)}`, payload).then((r) => r.data),

  archive: (id: string) => api.post(`/contabil/client-tasks/${encodeURIComponent(id)}/archive`).then((r) => r.data),

  reopen: (id: string) => api.post(`/contabil/client-tasks/${encodeURIComponent(id)}/reopen`).then((r) => r.data),

  duplicate: (id: string) => api.post(`/contabil/client-tasks/${encodeURIComponent(id)}/duplicate`).then((r) => r.data),

  remove: (id: string) => api.delete(`/contabil/client-tasks/${encodeURIComponent(id)}`).then((r) => r.data),

  addComment: (id: string, body: string) =>
    api.post(`/contabil/client-tasks/${encodeURIComponent(id)}/comments`, { body }).then((r) => r.data),
}

export const firmNotificationsApi = {
  list: (params?: { limit?: number; unreadOnly?: boolean }) =>
    api.get('/contabil/notifications', { params }).then((r) => r.data as { items: FirmNotification[]; unreadCount: number }),

  markRead: (id: string) => api.patch(`/contabil/notifications/${encodeURIComponent(id)}/read`).then((r) => r.data),

  markAllRead: () => api.post('/contabil/notifications/read-all').then((r) => r.data),
}

export type FirmNotification = {
  id: string
  category: 'TASK' | 'MESSAGE' | 'ALERT' | 'DOCUMENT' | 'DEADLINE' | 'SYSTEM'
  type: string
  title: string
  body?: string
  entityId?: string
  actionUrl?: string
  readAt?: string | null
  createdAt: string
}

export const teamApi = {
  list: () => api.get('/contabil/team').then((r) => r.data as { items: { id: string; fullName: string; email: string }[] }),
}

export const liveApi = {
  pollFirm: (since?: string) =>
    api.get('/contabil/live/events', { params: since ? { since } : undefined }).then((r) => r.data),
}

export const portalTasksApi = {
  complete: (id: string, note?: string) =>
    api
      .post(`/client-portal/me/contabil/tasks/${encodeURIComponent(id)}/complete`, { note })
      .then((r) => r.data),

  requestHelp: (id: string, message?: string) =>
    api
      .post(`/client-portal/me/contabil/tasks/${encodeURIComponent(id)}/help`, { message })
      .then((r) => r.data),

  addComment: (id: string, body: string) =>
    api
      .post(`/client-portal/me/contabil/tasks/${encodeURIComponent(id)}/comments`, { body })
      .then((r) => r.data),
}
