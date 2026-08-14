import type { MouseEventHandler, ReactNode } from 'react'

import { ExternalLink } from '@/shared/components/agency/ExternalLink'
import { AGENCY } from '@/shared/config/agency'
import { BRAND } from '@/shared/config/brand'
import { cn } from '@/shared/lib/utils'

type AgencyNameLinkProps = {
  className?: string
  /** Override do texto (default: AGENCY.displayName). */
  children?: ReactNode
  'aria-label'?: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** «AfDigital — Soluções Tecnológicas» → site oficial (nova aba). */
export function AgencyNameLink({
  className,
  children,
  'aria-label': ariaLabel,
  onClick,
}: AgencyNameLinkProps) {
  return (
    <ExternalLink
      href={AGENCY.url}
      className={cn(
        'font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
        className,
      )}
      aria-label={ariaLabel || `Website da ${AGENCY.displayName}`}
      onClick={onClick}
    >
      {children ?? AGENCY.displayName}
    </ExternalLink>
  )
}

type AgencyProductLineProps = {
  className?: string
  linkClassName?: string
}

/**
 * «Teglion · Um produto da AfDigital — Soluções Tecnológicas»
 * com o nome da empresa sempre clicável.
 */
export function AgencyProductLine({ className, linkClassName }: AgencyProductLineProps) {
  return (
    <span className={className} data-testid="agency-product-line">
      {BRAND.name} · Um produto da{' '}
      <AgencyNameLink className={linkClassName} />
    </span>
  )
}
