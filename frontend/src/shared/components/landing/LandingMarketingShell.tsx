import { useEffect, type ReactNode } from 'react'

import '@/shared/components/landing/landing.css'

import { LandingFooter } from '@/shared/components/landing/LandingFooter'
import { LandingHeader } from '@/shared/components/landing/LandingHeader'
import { applyPageSeo } from '@/shared/utils/seo'

type LandingMarketingShellProps = {
  title: string
  description?: string
  path?: string
  children: ReactNode
}

/** Layout partilhado das páginas públicas de marketing. */
export function LandingMarketingShell({ title, description, path, children }: LandingMarketingShellProps) {
  useEffect(() => {
    applyPageSeo({ title, description, path })
  }, [title, description, path])

  return (
    <div className="landing-page min-h-screen">
      <LandingHeader />
      <main className="pt-16">{children}</main>
      <LandingFooter />
    </div>
  )
}
