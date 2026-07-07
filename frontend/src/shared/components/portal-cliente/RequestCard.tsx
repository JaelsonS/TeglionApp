import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

export function RequestCard({
  selected,
  urgent,
  onClick,
  children,
}: {
  selected?: boolean
  urgent?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'pc-card-hover w-full p-4 text-left',
        selected && 'ring-2 ring-primary/25 border-primary/30',
        urgent && !selected && 'border-amber-500/30',
      )}
    >
      {children}
    </button>
  )
}
