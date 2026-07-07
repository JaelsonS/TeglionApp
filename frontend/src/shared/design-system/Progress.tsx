import { cn } from '@/shared/lib/utils'

type Props = {
  value: number
  max?: number
  className?: string
  label?: string
}

export function Progress({ value, max = 100, className, label }: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <div className="flex justify-between text-xs text-slate-500">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      ) : null}
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-[#0f2942] transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}
