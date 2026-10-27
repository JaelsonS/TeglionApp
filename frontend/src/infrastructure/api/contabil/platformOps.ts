import type { AxiosInstance } from 'axios'

export type PlatformOpsOverview = {
  firmsTotal: number
  activeFirmUsers: number
  auditEventsLast24h: number
  lockedAccounts: number | null
  trialsExpiring7d?: number | null
  suspendedFirms?: number | null
  firmsNew24h?: number | null
  firmsNew7d?: number | null
  authzFailures24h?: number | null
  ipDenylistActive?: number | null
  recentFirms?: Array<{
    id: string
    name: string
    slug: string
    createdAt: string
    status: string | null
    isNew24h: boolean
    isNew7d: boolean
  }>
  anomalies?: Array<{
    code: string
    severity: 'low' | 'medium' | 'high'
    message: string
    href?: string
  }>
  generatedAt: string
}

export type PlatformOpsFirm = {
  id: string
  name: string
  slug: string
  createdAt: string
  status: string | null
  subscriptionStatus: string | null
  trialEndsAt: string | null
  hasPublicSite: boolean
  internalOps?: boolean
  isNew24h?: boolean
  isNew7d?: boolean
}

export type PlatformOpsFirmDetail = PlatformOpsFirm & {
  countryCode: string | null
  billingPlan: string | null
  counts: {
    activeFirmUsers: number | null
    clients: number | null
  }
  recentAudit: PlatformOpsAuditItem[]
}

export type PlatformOpsAuditItem = {
  id: string
  firmId: string | null
  action: string
  actorRole: string | null
  actorId: string | null
  entityType: string | null
  entityId: string | null
  metadata: Record<string, unknown>
  ipAddress: string | null
  createdAt: string
}

export type PlatformOpsLoginAttempt = {
  accountKey: string
  failedCount: number
  lockedUntil: string | null
  lastAttemptAt: string | null
  lastIp: string | null
  countryCode?: string | null
  countryName?: string | null
  updatedAt: string | null
}

export type PlatformOpsSentrySummary = {
  configured: boolean
  dsnConfigured: boolean
  org: string | null
  project: string | null
  projectUrl: string | null
  issuesUrl: string | null
  hint: string | null
  items: Array<{
    id: string
    shortId: string | null
    title: string
    count: number
    userCount: number
    lastSeen: string | null
    firstSeen: string | null
    permalink: string | null
    level: string | null
  }>
}

export function createPlatformOpsApi(api: AxiosInstance) {
  return {
    me: () =>
      api.get('/platform-ops/me').then((r) => r.data as { ok: boolean; email: string; enabled: boolean; environment: string }),
    overview: () => api.get('/platform-ops/overview').then((r) => r.data as PlatformOpsOverview),
    firms: (params?: { limit?: number; offset?: number; q?: string; status?: string }) =>
      api.get('/platform-ops/firms', { params }).then(
        (r) => r.data as { items: PlatformOpsFirm[]; total: number | null },
      ),
    firmDetail: (firmId: string) =>
      api.get(`/platform-ops/firms/${firmId}`).then((r) => r.data as PlatformOpsFirmDetail),
    suspendFirm: (firmId: string) =>
      api.post(`/platform-ops/firms/${firmId}/suspend`).then((r) => r.data as { ok: boolean; status: string; already?: boolean }),
    reactivateFirm: (firmId: string) =>
      api
        .post(`/platform-ops/firms/${firmId}/reactivate`)
        .then((r) => r.data as { ok: boolean; status: string; already?: boolean }),
    extendTrial: (firmId: string, body: { days?: number; trialEndsAt?: string }) =>
      api
        .post(`/platform-ops/firms/${firmId}/extend-trial`, body)
        .then((r) => r.data as { ok: boolean; status: string; trialEndsAt: string | null }),
    cancelFirm: (firmId: string, confirmName: string) =>
      api
        .post(`/platform-ops/firms/${firmId}/cancel`, { confirmName })
        .then((r) => r.data as { ok: boolean; status: string; already?: boolean }),
    sentryIssues: (params?: { limit?: number }) =>
      api.get('/platform-ops/sentry/issues', { params }).then((r) => r.data as PlatformOpsSentrySummary),
    listIpDenylist: (params?: { limit?: number; offset?: number; includeRevoked?: boolean }) =>
      api
        .get('/platform-ops/ip-denylist', {
          params: {
            ...params,
            includeRevoked: params?.includeRevoked ? '1' : undefined,
          },
        })
        .then(
          (r) =>
            r.data as {
              items: Array<{
                id: string
                ip: string
                reason: string | null
                createdAt: string
                createdBy: string | null
                revokedAt: string | null
                revokedBy: string | null
                active: boolean
              }>
              total: number | null
            },
        ),
    addIpDenylist: (body: { ip: string; reason?: string }) =>
      api
        .post('/platform-ops/ip-denylist', body)
        .then((r) => r.data as { ok: boolean; id: string; ip: string; already?: boolean }),
    revokeIpDenylist: (body: { id?: string; ip?: string }) =>
      api
        .post('/platform-ops/ip-denylist/revoke', body)
        .then((r) => r.data as { ok: boolean; id: string; ip: string; revoked: boolean }),
    auditLogs: (params?: {
      limit?: number
      offset?: number
      action?: string
      firmId?: string
      since?: string
    }) =>
      api.get('/platform-ops/audit-logs', { params }).then(
        (r) => r.data as { items: PlatformOpsAuditItem[]; total: number | null },
      ),
    loginAttempts: (params?: { limit?: number; offset?: number; lockedOnly?: boolean }) =>
      api
        .get('/platform-ops/login-attempts', {
          params: {
            ...params,
            lockedOnly: params?.lockedOnly ? '1' : undefined,
          },
        })
        .then((r) => r.data as { items: PlatformOpsLoginAttempt[]; total: number | null }),
    clearLockout: (accountKey: string) =>
      api
        .post('/platform-ops/login-attempts/clear-lockout', { accountKey })
        .then((r) => r.data as { ok: boolean; accountKey: string }),
    exportCsv: async (kind: 'firms' | 'audit' | 'logins', params?: Record<string, string | undefined>) => {
      const res = await api.get(`/platform-ops/export/${kind}`, {
        params,
        responseType: 'blob',
      })
      const blob = res.data as Blob
      const disposition = String(res.headers?.['content-disposition'] || '')
      const match = disposition.match(/filename="([^"]+)"/)
      const filename = match?.[1] || `ops-${kind}.csv`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    },
  }
}
