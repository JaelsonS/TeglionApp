/** Rotas públicas leves — sem AuthContext, React Query nem branding de escritório. */
export function isLightweightPublicRoute(pathname: string): boolean {
  if (pathname === '/' || pathname.startsWith('/blog')) return true
  if (['/pricing', '/security', '/case-studies'].includes(pathname)) return true
  if (['/termos', '/privacidade', '/cookies', '/dpa', '/aviso-legal'].includes(pathname)) return true
  return false
}

export function isAuthenticatedAppRoute(pathname: string): boolean {
  if (pathname.startsWith('/app') || pathname.startsWith('/auth')) return true
  if (pathname === '/recover-password' || pathname.startsWith('/reset-password')) return true
  return false
}
