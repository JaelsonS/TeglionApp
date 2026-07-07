import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

export function ChatBubble({
  mine,
  children,
  timestamp,
  avatar,
}: {
  mine?: boolean
  children: ReactNode
  timestamp?: string
  avatar?: React.ReactNode
}) {
  return (
    <div className={cn('flex gap-2', mine && 'flex-row-reverse')}>
      {avatar ? <div className="shrink-0">{avatar}</div> : null}
      <div className={cn('max-w-[85%]', mine && 'items-end')}>
        <div
          className={cn(
            'rounded-[12px] px-3 py-2 text-sm leading-relaxed',
            mine
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm border border-border bg-muted text-foreground',
          )}
        >
          {children}
        </div>
        {timestamp ? (
          <p className={cn('mt-1 text-[12px] text-muted-foreground', mine && 'text-right')}>{timestamp}</p>
        ) : null}
      </div>
    </div>
  )
}
