import { AGENCY } from '@/shared/config/agency'
import { trackProductEvent } from '@/shared/utils/productAnalytics'
import { cn } from '@/shared/lib/utils'

type Props = {
  surface: 'client' | 'firm'
  className?: string
}

export function AgencyCredit({ surface, className }: Props) {
  return (
    <p className={cn('text-center text-[11px] leading-relaxed text-muted-foreground', className)}>
      {AGENCY.creditLabel}{' '}
      <a
        href={AGENCY.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-foreground/80 underline-offset-2 hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        onClick={() => trackProductEvent('agency_click', { surface, placement: 'credit' })}
      >
        {AGENCY.name}
      </a>
    </p>
  )
}
