import type { AxiosInstance } from 'axios'

export type PlatformOpsOverview = {
  firmsTotal: number
  activeFirmUsers: number
  auditEventsLast24h: number
  lockedAccounts: number | null
  generatedAt: string
}

export type PlatformOpsFirm = {
  id: string
  name: string
  slug: string
  createdAt: string
  subscriptionStatus: string | null
  trialEndsAt: string | null
  hasPublicSite: boolean
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
  updatedAt: string | null
}

export function createPlatformOpsApi(api: AxiosInstance) {
  return {
    me: () =>
      api.get('/platform-ops/me').then((r) => r.data as { ok: boolean; email: string; enabled: boolean; environment: string }),
    overview: () => api.get('/platform-ops/overview').then((r) => r.data as PlatformOpsOverview),
    firms: (params?: { limit?: number; offset?: number; q?: string }) =>
      api.get('/platform-ops/firms', { params }).then(
        (r) => r.data as { items: PlatformOpsFirm[]; total: number | null },
      ),
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
    loginAttempts: (params?: { limit?: number; offset?: number }) =>
      api.get('/platform-ops/login-attempts', { params }).then(
        (r) => r.data as { items: PlatformOpsLoginAttempt[]; total: number | null },
      ),
  }
}
