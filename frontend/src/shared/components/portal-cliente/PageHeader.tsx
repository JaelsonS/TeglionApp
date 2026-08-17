import type { ReactNode } from 'react'

import { PageHeader as DsPageHeader } from '@/shared/design-system/PageHeader'
import { cn } from '@/shared/lib/utils'

/** Cabeçalho do portal cliente — delega tipografia ao design system. */
export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  className,
}: {
  title: string
  subtitle?: string
  breadcrumb?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4 md:mb-6', className)}>
      {breadcrumb ? (
        <p className="cb-text-label mb-1.5 hidden text-muted-foreground md:block">{breadcrumb}</p>
      ) : null}
      <DsPageHeader
        title={title}
        subtitle={subtitle}
        right={actions}
        testId="client-page-header"
        className="mb-0 max-md:[&_h1]:hidden"
      />
    </div>
  )
}
