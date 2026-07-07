import type { LucideIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

export type SegmentOption<T extends string> = {
  id: T
  label: string
  icon?: LucideIcon
  count?: number
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T
  onChange: (id: T) => void
  options: SegmentOption<T>[]
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex flex-wrap gap-1 rounded-2xl border border-border/60 bg-muted/30 p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.id === value
        const Icon = opt.icon
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl font-medium transition-all',
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
              active
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border/80'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
            {opt.label}
            {opt.count != null ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                  active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {opt.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
