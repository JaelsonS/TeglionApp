import { Building2 } from 'lucide-react'

import { contabilPt as t } from '@/shared/i18n/contabilPt'
import { cn } from '@/shared/lib/utils'

export function FirmSidebarHeader({
  name,
  logoUrl,
  subtitle,
  fallbackName,
  size = 'default',
}: {
  name?: string | null
  logoUrl?: string | null
  subtitle?: string | null
  fallbackName?: string
  /** default = drawer · sm = rail · panel = painel expandido */
  size?: 'default' | 'sm' | 'panel'
}) {
  const resolvedName = (name || fallbackName || t.brand).trim()
  const sm = size === 'sm'
  const panel = size === 'panel'

  const logo = logoUrl ? (
    <img
      src={logoUrl}
      alt={resolvedName}
      className={cn(
        'rounded-lg object-cover shadow-sm ring-1 ring-border/80',
        sm ? 'h-9 w-9' : panel ? 'h-10 w-10' : 'h-14 w-14',
      )}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg bg-brand/10 text-brand shadow-sm ring-1 ring-brand/15',
        sm ? 'h-9 w-9' : panel ? 'h-10 w-10' : 'h-14 w-14',
      )}
    >
      <Building2 className={cn(sm ? 'h-4 w-4' : panel ? 'h-5 w-5' : 'h-6 w-6')} />
    </div>
  )

  if (sm) {
    return <div className="flex justify-center">{logo}</div>
  }

  if (panel) {
    return (
      <div className="flex items-center gap-3 px-1">
        {logo}
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold leading-tight text-foreground">{resolvedName}</p>
          {subtitle ? (
            <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {logo}
      <div className="space-y-1">
        <p className="break-words text-lg font-semibold tracking-tight text-foreground">{resolvedName}</p>
        {subtitle ? (
          <p className="mx-auto max-w-[220px] text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  )
}
