import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { PageHeader } from '@/shared/components/layout/PageHeader'
import { cn } from '@/shared/lib/utils'

export type FirmModuleTab = {
  to: string
  label: string
  testId?: string
}

type FirmModuleShellProps = {
  title: string
  subtitle?: string
  tabs?: FirmModuleTab[]
  headerRight?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  tabsClassName?: string
}

/** Cabeçalho + tabs unificados para módulos do escritório. */
export function FirmModuleShell({
  title,
  subtitle,
  tabs,
  headerRight,
  children,
  className,
  bodyClassName,
  tabsClassName,
}: FirmModuleShellProps) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}>
      <div className="shrink-0 px-4 pt-4 sm:px-5">
        <PageHeader title={title} subtitle={subtitle} right={headerRight} testId="firm-module-header" />
        {tabs?.length ? (
          <nav
            className={cn('cb-docs-page-tabs mt-3', tabsClassName)}
            aria-label="Secções do módulo"
          >
            {tabs.map(({ to, label, testId }) => (
              <NavLink
                key={to}
                to={to}
                data-testid={testId}
                className={({ isActive }) =>
                  cn('cb-docs-page-tab', isActive && 'cb-docs-page-tab-active')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        ) : null}
      </div>
      <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden', bodyClassName)}>
        {children}
      </div>
    </div>
  )
}
