import type { AxiosInstance } from 'axios'

import type { ClientDetailResponse, ClientsListResponse, ContabilClient } from './types'

export function createContabilClientsApi(api: AxiosInstance) {
  return {
    list: (params?: { page?: number; limit?: number; includeInactive?: string }) =>
      api.get('/contabil/clients', { params }).then((r) => {
        const data = r.data as { items?: Array<Record<string, unknown>>; total?: number }
        const items = (data.items || []).map((c) => ({
          ...c,
          _id: String(c._id || c.id || ''),
          id: String(c.id || c._id || ''),
          name: String(c.name || c.displayName || ''),
          fullName: (c.fullName as string) || (c.displayName as string) || undefined,
        }))
        return { ...data, items }
      }),

    create: (payload: {
      name?: string
      fullName?: string
      displayName?: string
      email?: string
      phone?: string
      taxId?: string
      metadata?: unknown
      assignedStaffId?: string
    }) =>
      api
        .post('/contabil/clients', {
          displayName: payload.name || payload.fullName || payload.displayName,
          email: payload.email,
          phone: payload.phone,
          taxId: payload.taxId,
          metadata: payload.metadata,
          assignedStaffId: payload.assignedStaffId,
        })
        .then((r) => {
          const c = (r.data as { client?: Record<string, unknown> }).client || r.data
          return {
            client: {
              ...c,
              _id: c._id || c.id,
              name: c.name || c.displayName,
            },
          }
        }),

    getById: (id: string) =>
      api.get(`/contabil/clients/${encodeURIComponent(id)}`).then((r) => {
        const c = (r.data as { client?: Record<string, unknown> }).client || r.data
        return { ...c, _id: c._id || c.id, name: c.name || c.displayName }
      }),

    validateNif: (nif: string, excludeClientId?: string) =>
      api
        .get('/contabil/clients/validate-nif', {
          params: { nif, excludeClientId: excludeClientId || undefined },
        })
        .then(
          (r) =>
            r.data as {
              valid: boolean
              normalized?: string | null
              message?: string
              reason?: string
            },
        ),

    getHub: (clientId: string) =>
      api.get(`/contabil/clients/${encodeURIComponent(clientId)}/hub`).then((r) => r.data),

    listActivityHistory: (
      clientId: string,
      params?: {
        from?: string
        to?: string
        kind?: string
        q?: string
        hidden?: 'all' | 'visible' | 'hidden'
        page?: number
        limit?: number
      },
    ) =>
      api
        .get(`/contabil/clients/${encodeURIComponent(clientId)}/activity-history`, { params })
        .then(
          (r) =>
            r.data as {
              items: import('./types').ClientHubTimelineItem[]
              total: number
              page: number
              limit: number
            },
        ),

    hideActivity: (clientId: string, activityId: string) =>
      api
        .post(
          `/contabil/clients/${encodeURIComponent(clientId)}/activity/${encodeURIComponent(activityId)}/hide`,
        )
        .then((r) => r.data as { item: import('./types').ClientHubTimelineItem }),

    unhideActivity: (clientId: string, activityId: string) =>
      api
        .post(
          `/contabil/clients/${encodeURIComponent(clientId)}/activity/${encodeURIComponent(activityId)}/unhide`,
        )
        .then((r) => r.data as { item: import('./types').ClientHubTimelineItem }),

    hideAllFeedActivity: (clientId: string) =>
      api
        .post(`/contabil/clients/${encodeURIComponent(clientId)}/activity/hide-all`)
        .then((r) => r.data as { hidden: number }),

    patch: (clientId: string, payload: Record<string, unknown>) =>
      api.patch(`/contabil/clients/${encodeURIComponent(clientId)}`, payload).then((r) => r.data),

    archive: (clientId: string) =>
      api.delete(`/contabil/clients/${encodeURIComponent(clientId)}`).then((r) => r.data),

    exportClientsCsv: async (template = false) => {
      const r = await api.get('/contabil/clients/export-csv', {
        params: template ? { template: '1' } : undefined,
        responseType: 'blob',
      })
      const blob = r.data as Blob
      const type = String(r.headers?.['content-type'] || blob.type || '')
      if (type.includes('application/json')) {
        const parsed = JSON.parse(await blob.text()) as { message?: string }
        throw new Error(parsed.message || 'Não foi possível exportar o CSV')
      }
      return blob
    },

    importClientsCsv: async (file: File, currentPassword?: string) => {
      const fd = new FormData()
      fd.append('file', file)
      if (currentPassword) fd.append('currentPassword', currentPassword)
      const r = await api.post('/contabil/clients/import-csv', fd, { timeout: 120000 })
      return r.data as {
        created: number
        updated: number
        skipped: number
        errors: Array<{ line: number; message: string }>
      }
    },

    createInvite: (payload: { clientId: string; email?: string; initialPassword?: string }) =>
      api
        .post('/contabil/invites', {
          clientId: payload.clientId,
          email: payload.email,
          initialPassword: payload.initialPassword,
        })
        .then(
          (r) =>
            r.data as {
              inviteUrl: string
              activatedWithPassword?: boolean
              expiresAt?: string | null
            },
        ),

    createBulkInvite: (
      clientIds: string[],
      email?: { subject?: string; bodyText?: string },
    ) =>
      api
        .post('/contabil/invites/bulk', {
          clientIds,
          subject: email?.subject,
          bodyText: email?.bodyText,
        })
        .then(
          (r) =>
            r.data as {
              requested: number
              sent: number
              alreadyActive: number
              skippedNoEmail: number
              failed: number
              pending?: number
            },
        ),

    previewInviteEmail: (clientName?: string) =>
      api
        .get('/contabil/invites/email-preview', { params: clientName ? { clientName } : undefined })
        .then((r) => r.data as { subject: string; bodyHtml: string; bodyText: string; footerNote?: string }),

    sendTestInviteEmail: (payload: {
      toEmail: string
      subject?: string
      bodyText?: string
    }) => api.post('/contabil/invites/test-email', payload).then((r) => r.data as { sent: boolean }),

    listOfficialAccesses: (clientId: string) =>
      api.get(`/contabil/clients/${encodeURIComponent(clientId)}/official-accesses`).then((r) => r.data),

    upsertOfficialAccess: (
      clientId: string,
      payload: {
        currentPassword: string
        portalKey: string
        accessId?: string | null
        username?: string | null
        password?: string
        label?: string | null
      },
    ) => api.put(`/contabil/clients/${encodeURIComponent(clientId)}/official-accesses`, payload).then((r) => r.data),

    revealOfficialAccess: (clientId: string, accessId: string, payload: { currentPassword: string }) =>
      api
        .post(
          `/contabil/clients/${encodeURIComponent(clientId)}/official-accesses/${encodeURIComponent(accessId)}/reveal`,
          payload,
        )
        .then((r) => r.data),

    removeOfficialAccess: (clientId: string, accessId: string, payload: { currentPassword: string }) =>
      api
        .post(
          `/contabil/clients/${encodeURIComponent(clientId)}/official-accesses/${encodeURIComponent(accessId)}/remove`,
          payload,
        )
        .then((r) => r.data),

    getAccessHistory: (clientId: string) =>
      api.get(`/contabil/clients/${encodeURIComponent(clientId)}/access-history`).then(
        (r) =>
          r.data as {
            portalAccessStatus: string
            items: Array<{ id: string; action: string; label: string; createdAt: string; metadata: Record<string, unknown> }>
          },
      ),

    revokeAccess: (clientId: string) =>
      api
        .post(`/contabil/clients/${encodeURIComponent(clientId)}/revoke-access`)
        .then((r) => r.data as { revoked: boolean }),

    resendInvite: (clientId: string) =>
      api
        .post(`/contabil/clients/${encodeURIComponent(clientId)}/resend-invite`)
        .then((r) => r.data as { inviteUrl: string; emailSent: boolean }),
  }
}

export type ContabilClientsApi = ReturnType<typeof createContabilClientsApi>

function normalizeClient(raw: Record<string, unknown>): ContabilClient {
  const id = String(raw._id || raw.id || '')
  return {
    ...(raw as ContabilClient),
    _id: id,
    id,
    name: String(raw.name || raw.displayName || raw.fullName || ''),
    fullName: (raw.fullName as string) || (raw.displayName as string) || null,
  }
}

/** Helpers para React Query — importam `contabilClientsApi` de `@/infrastructure/api`. */
export async function fetchClientsList(
  listClients: ContabilClientsApi['list'],
  params?: { page?: number; limit?: number },
): Promise<ClientsListResponse> {
  const data = (await listClients(params)) as ClientsListResponse
  return {
    ...data,
    items: (data.items || []).map((c) => normalizeClient(c as unknown as Record<string, unknown>)),
  }
}

export async function fetchClientById(
  getById: ContabilClientsApi['getById'],
  clientId: string,
): Promise<ContabilClient> {
  const data = (await getById(clientId)) as Record<string, unknown>
  const client = (data.client as Record<string, unknown>) || data
  return normalizeClient(client)
}

export async function fetchClientDetail(
  getById: ContabilClientsApi['getById'],
  clientId: string,
): Promise<ClientDetailResponse> {
  const client = await fetchClientById(getById, clientId)
  return { client }
}
