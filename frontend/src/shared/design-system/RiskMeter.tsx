import { cn } from '@/shared/lib/utils'

export function RiskMeter({
  score,
  reason,
  className,
}: {
  score: number
  reason: string
  className?: string
}) {
  const clamped = Math.min(100, Math.max(0, score))
  const tone =
    clamped >= 70 ? 'danger' : clamped >= 40 ? 'warning' : 'success'

  const barClass =
    tone === 'danger' ? 'bg-red-500' : tone === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'

  const label =
    clamped === 0
      ? 'Sem risco'
      : tone === 'danger'
        ? 'Risco elevado'
        : tone === 'warning'
          ? 'Atenção'
          : 'Estável'

  return (
    <div
      className={cn(
        'cb-risk-meter w-full max-w-full rounded-2xl border border-border/50 bg-card p-4 max-xl:shadow-none',
        className,
      )}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Risco operacional
          </p>
          <p
            className={cn(
              'mt-0.5 font-display text-2xl font-semibold tabular-nums',
              tone === 'danger' && 'text-red-600',
              tone === 'warning' && 'text-amber-700',
              tone === 'success' && 'text-emerald-700',
            )}
          >
            {clamped}%
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
            tone === 'danger' && 'bg-red-100 text-red-800',
            tone === 'warning' && 'bg-amber-100 text-amber-900',
            tone === 'success' && 'bg-emerald-100 text-emerald-800',
          )}
        >
          {label}
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-muted">
        <div className={cn('h-full rounded-full max-xl:transition-none', barClass)} style={{ width: `${clamped}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{reason}</p>
    </div>
  )
}
