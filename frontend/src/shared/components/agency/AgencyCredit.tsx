import { AgencyNameLink } from '@/shared/components/agency/AgencyNameLink'
import { AGENCY } from '@/shared/config/agency'
import { trackProductEvent } from '@/shared/utils/productAnalytics'
import { cn } from '@/shared/lib/utils'

type Props = {
  surface: 'client' | 'firm'
  className?: string
  /** Só o nome da agência, sem o prefixo «Desenvolvido por». */
  nameOnly?: boolean
}

export function AgencyCredit({ surface, className, nameOnly = false }: Props) {
  return (
    <p className={cn('text-center text-[11px] leading-relaxed text-muted-foreground', className)}>
      {nameOnly ? null : <>{AGENCY.creditLabel}{' '}</>}
      <AgencyNameLink
        className="text-foreground/80 hover:text-brand"
        aria-label={nameOnly ? AGENCY.displayName : `${AGENCY.creditLabel} ${AGENCY.displayName}`}
        onClick={() => trackProductEvent('agency_click', { surface, placement: 'credit' })}
      />
    </p>
  )
}
