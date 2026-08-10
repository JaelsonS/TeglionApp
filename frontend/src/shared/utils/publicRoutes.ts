/** Rotas públicas leves — sem AuthContext, React Query nem branding de escritório. */
export function isLightweightPublicRoute(pathname: string): boolean {
  if (pathname === '/' || pathname.startsWith('/blog')) return true
  if (['/pricing', '/case-studies', '/suporte'].includes(pathname)) return true
  if (['/termos', '/privacidade', '/cookies', '/dpa', '/aviso-legal'].includes(pathname)) return true
  return false
}

export function isAuthenticatedAppRoute(pathname: string): boolean {
  if (pathname.startsWith('/app') || pathname.startsWith('/auth')) return true
  if (pathname === '/recover-password' || pathname.startsWith('/reset-password')) return true
  return false
}

/**
 * Páginas públicas de captação (ServiceIntakePublicPage, ServiceIntakePortalPage)
 * — sem login, mas usam useQuery. Nem "lightweight" (precisam de QueryClientProvider)
 * nem "authenticated" (nunca têm sessão) — categoria própria para não caírem sem
 * nenhum provider (useQuery sem QueryClientProvider, useAuth sem AuthProvider).
 */
export function isPublicIntakeRoute(pathname: string): boolean {
  if (pathname.startsWith('/pedidos/')) return true
  if (/^\/[^/]+\/servicos\/[^/]+\/?$/.test(pathname)) return true
  return false
}
