import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { PageRouteFallback } from '@/shared/components/layout/PageRouteFallback'
import { useAuth } from '@/shared/hooks/useAuth'
import { isPlatformOpsUser } from '@/shared/utils/authNormalize'

/**
 * Contas PLATFORM_OPS não usam o produto gabinete (clientes, docs, etc.).
 * Excepção: Definições (MFA / segurança da própria conta).
 */
export function PlatformOpsFirmGuard() {
  const { user, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) return <PageRouteFallback />

  if (isPlatformOpsUser(user)) {
    const path = location.pathname
    const allowSettings = path === '/app/firm/settings' || path.startsWith('/app/firm/settings/')
    if (!allowSettings) {
      return <Navigate to="/app/ops" replace />
    }
  }

  return <Outlet />
}
