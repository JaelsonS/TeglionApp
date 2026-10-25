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
  /** Sem PageHeader — para uso dentro de modal/dialog. */
  embedded?: boolean
}

/** Cabeçalho + tabs unificados para módulos do gabinete. */
export function FirmModuleShell({
  title,
  subtitle,
  tabs,
  headerRight,
  children,
  className,
  bodyClassName,
  tabsClassName,
  embedded = false,
}: FirmModuleShellProps) {
  /** Documentos usa scroll de página; outros módulos podem prender altura. */
  const pageScroll = Boolean(className?.includes('cb-docs-page'))

  return (
    <div
      className={cn(
        embedded
          ? 'flex min-w-0 flex-col'
          : pageScroll
            ? 'flex min-w-0 w-full flex-col'
            : 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
        className,
      )}
    >
      {!embedded ? (
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
                  className={({ isActive }: { isActive: boolean }) =>
                    cn('cb-docs-page-tab', isActive && 'cb-docs-page-tab-active')
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          ) : null}
        </div>
      ) : null}
      <div
        className={cn(
          embedded
            ? 'min-w-0 flex-col'
            : pageScroll
              ? 'flex w-full min-w-0 flex-col'
              : 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
          bodyClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
