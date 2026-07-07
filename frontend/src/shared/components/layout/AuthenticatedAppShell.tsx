import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { AuthProvider } from '@/shared/contexts/AuthContext'
import { FirmBrandingProvider } from '@/shared/contexts/FirmBrandingContext'
import { ensureFullI18n } from '@/i18n'
import { QueryProvider } from '@/shared/providers/QueryProvider'

/** Providers pesados — só carregados em /app, /auth e recuperação de password. */
export function AuthenticatedAppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    void ensureFullI18n()
  }, [])

  return (
    <AuthProvider>
      <QueryProvider>
        <FirmBrandingProvider>{children}</FirmBrandingProvider>
      </QueryProvider>
    </AuthProvider>
  )
}
