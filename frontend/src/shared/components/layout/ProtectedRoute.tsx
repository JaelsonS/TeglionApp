/**
 * ProtectedRoute.tsx
 * 
 * Protege rotas privadas.
 * - Se estiver bootstrapping, mostra estado de carregamento
 * - Se não estiver autenticado, redireciona para /login
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { AuthBootstrapFallback } from '@/shared/components/layout/AuthBootstrapFallback'
import { isContabilMode } from '@/shared/config/productMode'
import { authClientLoginUrl, authFirmLoginUrl, authOpsLoginUrl } from '@/shared/constants/authPaths'
import { useAuth } from '@/shared/hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return <AuthBootstrapFallback />
  }

  if (!isAuthenticated) {
    const isOpsPath = location.pathname === '/app/ops' || location.pathname.startsWith('/app/ops/')
    const isClientPath = location.pathname.startsWith('/app/client')
    const loginTo = isOpsPath
      ? authOpsLoginUrl()
      : isClientPath
        ? authClientLoginUrl()
        : authFirmLoginUrl()
    if (isContabilMode()) {
      return (
        <Navigate
          to={loginTo}
          replace
          state={{ from: location.pathname }}
        />
      )
    }
    return (
      <Navigate
        to={isOpsPath ? '/auth/ops/login' : isClientPath ? '/auth/client/login' : '/auth/firm/login'}
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <>{children}</>
}
