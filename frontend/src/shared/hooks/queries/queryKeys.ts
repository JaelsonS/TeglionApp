/** Chaves TanStack Query — escopo de sessão (tenant resolvido no JWT, não no cliente). */
export const queryKeys = {
  firmInbox: (tenantSlug: string, filters?: { clientId?: string; status?: string }) =>
    ['firm-inbox', tenantSlug, filters?.clientId || '', filters?.status || ''] as const,
  firmDashboard: (tenantSlug: string) => ['firm-dashboard', tenantSlug] as const,
  clientPortalHub: (clientId: string) => ['client-portal-hub', clientId] as const,
  liveEvents: (scope: 'firm' | 'client') => ['live-events', scope] as const,
}
