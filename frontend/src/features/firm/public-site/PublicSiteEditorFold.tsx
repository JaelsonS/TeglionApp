import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type Props = {
  id?: string
  title: string
  hint?: string
  closedSummary?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
  children: ReactNode
}

export function PublicSiteEditorFold({
  id,
  title,
  hint,
  closedSummary,
  open,
  onOpenChange,
  className,
  children,
}: Props) {
  return (
    <section
      id={id}
      className={cn('rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5', className)}
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 rounded-lg text-left transition-colors hover:bg-muted/30 -m-1 p-1"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <ChevronRight
          className={cn('mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
          {!open && closedSummary ? (
            <span className="mt-1.5 block text-xs leading-snug text-muted-foreground">{closedSummary}</span>
          ) : null}
          {open && hint ? (
            <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">{hint}</span>
          ) : null}
        </span>
      </button>
      {open ? <div className="mt-4 space-y-4 border-t border-border/40 pt-4">{children}</div> : null}
    </section>
  )
}
