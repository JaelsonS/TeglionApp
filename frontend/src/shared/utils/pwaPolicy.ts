/** Regista service worker só no produto autenticado — evita precache de 5 MB no blog. */
export function shouldRegisterPwa(pathname: string): boolean {
  return pathname.startsWith('/app') || pathname.startsWith('/auth')
}
