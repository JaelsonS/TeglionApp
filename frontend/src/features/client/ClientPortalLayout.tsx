/**
 * Layout do portal cliente — contexto de branding + shell adaptativo (sidebar / drawer).
 */
import { createContext, useContext, useEffect, useMemo } from 'react'
import { Navigate } from 'react-router-dom'

import { ClientPortalShell } from '@/features/client/ClientPortalShell'
import { PageLoading } from '@/shared/design-system'
import { LiveEventsProvider } from '@/shared/providers/LiveEventsProvider'
import { useAuth } from '@/shared/hooks/useAuth'
import { useFirmBranding } from '@/shared/hooks/useFirmBranding'
import { authClientLoginUrl } from '@/shared/constants/authPaths'
import { cleanRecoverQueryFromUrl } from '@/shared/utils/cleanRecoverQuery'
import type { Firm } from '@/shared/types/firm'

type ClientPortalContextValue = {
  firm: Firm | null
  firmLogoUrl: string | null
}

export const ClientPortalContext = createContext<ClientPortalContextValue | null>(null)

export function useClientPortalContext() {
  const ctx = useContext(ClientPortalContext)
  if (!ctx) throw new Error('useClientPortalContext must be used within ClientPortalLayout')
  return ctx
}

export function ClientPortalLayout() {
  const { user } = useAuth()
  const { firm, firmLogoUrl, isLoading } = useFirmBranding()
  const value = useMemo(() => ({ firm, firmLogoUrl }), [firm, firmLogoUrl])

  useEffect(() => {
    cleanRecoverQueryFromUrl()
    document.documentElement.classList.add('client-portal-active')
    return () => {
      document.documentElement.classList.remove('client-portal-active')
      document.body.style.removeProperty('overflow')
    }
  }, [])

  if (isLoading) {
    return (
      <div className="pc-shell flex items-center justify-center" role="status">
        <PageLoading label="A carregar portal…" />
      </div>
    )
  }

  if (!user || user.role !== 'CLIENT' || !user.tenant?.slug) {
    return <Navigate to={authClientLoginUrl()} replace />
  }

  return (
    <ClientPortalContext.Provider value={value}>
      <LiveEventsProvider scope="client">
        <ClientPortalShell />
      </LiveEventsProvider>
    </ClientPortalContext.Provider>
  )
}