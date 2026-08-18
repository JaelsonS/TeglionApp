/** Chaves TanStack Query — escopo de sessão (tenant resolvido no JWT, não no cliente). */
export const queryKeys = {
  firmInbox: (tenantSlug: string, filters?: { clientId?: string; status?: string }) =>
    ['firm-inbox', tenantSlug, filters?.clientId || '', filters?.status || ''] as const,
  firmDashboard: (tenantSlug: string) => ['firm-dashboard', tenantSlug] as const,
  firmClientsDirectoryRoot: (tenantSlug: string) => ['firm-clients-directory', tenantSlug] as const,
  firmClientsDirectory: (
    tenantSlug: string,
    opts: { limit: number; includeInactive: boolean },
  ) =>
    [...queryKeys.firmClientsDirectoryRoot(tenantSlug), opts.limit, opts.includeInactive ? '1' : '0'] as const,
  clientPortalHub: (clientId: string) => ['client-portal-hub', clientId] as const,
  liveEventsRoot: (scope: 'firm' | 'client') => ['live-events', scope] as const,
  liveEvents: (scope: 'firm' | 'client', tenantKey: string) =>
    [...queryKeys.liveEventsRoot(scope), tenantKey] as const,
}
