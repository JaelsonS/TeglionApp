import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

export function ProfileSectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border/40 bg-gradient-to-b from-card to-muted/10 p-5 shadow-sm',
        className,
      )}
    >
      <header className="mb-4 border-b border-border/30 pb-3">
        <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
