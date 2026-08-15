import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { isAuthenticatedAppRoute, isLightweightPublicRoute, isPublicIntakeRoute } from '@/shared/utils/publicRoutes'
import { ensureContabilStyles } from '@/shared/styles/loadContabilStyles'

const AuthenticatedAppShell = lazy(() =>
  import('@/shared/components/layout/AuthenticatedAppShell').then((m) => ({ default: m.AuthenticatedAppShell })),
)

const QueryProvider = lazy(() =>
  import('@/shared/providers/QueryProvider').then((m) => ({ default: m.QueryProvider })),
)

const MarketingCookieBanner = lazy(() =>
  import('@/shared/components/compliance/MarketingCookieBanner').then((m) => ({ default: m.MarketingCookieBanner })),
)
const CookieBanner = lazy(() => import('@/shared/components/compliance/CookieBanner').then((m) => ({ default: m.CookieBanner })))

const Toaster = lazy(() => import('sonner').then((m) => ({ default: m.Toaster })))

export function AppProviders({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  useEffect(() => {
    if (!isLightweightPublicRoute(pathname)) {
      ensureContabilStyles()
    }
  }, [pathname])

  if (isLightweightPublicRoute(pathname)) {
    return <>{children}</>
  }

  if (isPublicIntakeRoute(pathname)) {
    // Sem login, mas usam useQuery — só o QueryClientProvider, sem AuthProvider
    // nem FirmBrandingProvider (nenhuma das duas páginas precisa).
    return (
      <Suspense fallback={null}>
        <QueryProvider>{children}</QueryProvider>
      </Suspense>
    )
  }

  if (!isAuthenticatedAppRoute(pathname)) {
    return <>{children}</>
  }

  return (
    <Suspense fallback={null}>
      <AuthenticatedAppShell>{children}</AuthenticatedAppShell>
    </Suspense>
  )
}

export function RouteCookieBanner() {
  const { pathname } = useLocation()
  // Captação pública e auth com Turnstile: o banner cobre o widget Cloudflare
  // e dispara error-callback («verificação não concluiu»).
  if (isPublicIntakeRoute(pathname)) return null
  if (pathname.startsWith('/auth')) return null
  const marketing = isLightweightPublicRoute(pathname)

  return (
    <Suspense fallback={null}>
      {marketing ? <MarketingCookieBanner /> : <CookieBanner />}
    </Suspense>
  )
}

export function RouteToaster() {
  const { pathname } = useLocation()
  if (isLightweightPublicRoute(pathname)) return null

  return (
    <Suspense fallback={null}>
      <Toaster richColors position="top-right" />
    </Suspense>
  )
}
