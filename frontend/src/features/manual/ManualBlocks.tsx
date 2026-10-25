import { Link } from 'react-router-dom'

import type { ManualBlock } from '@/content/manual'
import { isAllowedManualInternalHref } from '@/content/manual'
import { MayaAvatar } from '@/features/maya'
import { cn } from '@/shared/lib/utils'

const CALLOUT: Record<
  NonNullable<Extract<ManualBlock, { type: 'callout' }>['variant']>,
  string
> = {
  tip: 'border-emerald-200/80 bg-emerald-50/70 text-emerald-950',
  info: 'border-sky-200/80 bg-sky-50/70 text-sky-950',
  warning: 'border-amber-200/80 bg-amber-50/70 text-amber-950',
  security: 'border-rose-200/80 bg-rose-50/70 text-rose-950',
}

/** Render tipado — nunca usa dangerouslySetInnerHTML. */
export function ManualBlocks({ blocks }: { blocks: ManualBlock[] }) {
  return (
    <div className="space-y-5 text-[15px] leading-relaxed text-[#1a2b3c]">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'maya':
            return (
              <aside
                key={i}
                className="flex gap-3 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/[0.08] to-transparent p-4"
              >
                <MayaAvatar size="md" variant="md" />
                <p className="min-w-0 flex-1 pt-1 text-sm sm:text-[15px]">
                  <span className="font-semibold text-brand">Maya: </span>
                  {block.text}
                </p>
              </aside>
            )
          case 'p':
            return (
              <p key={i} className="text-[#334155]">
                {block.text}
              </p>
            )
          case 'h2':
            return (
              <h2 key={i} className="pt-2 text-xl font-semibold tracking-tight text-[#0F2942]">
                {block.text}
              </h2>
            )
          case 'ul':
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-5 text-[#334155]">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} className="list-decimal space-y-1.5 pl-5 text-[#334155]">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            )
          case 'callout':
            return (
              <div
                key={i}
                className={cn('rounded-xl border px-4 py-3 text-sm', CALLOUT[block.variant])}
              >
                {block.title ? <p className="font-semibold">{block.title}</p> : null}
                <p className={cn(block.title && 'mt-1')}>{block.text}</p>
              </div>
            )
          case 'appLink':
            if (!isAllowedManualInternalHref(block.href)) {
              return null
            }
            return (
              <p key={i}>
                <Link
                  to={block.href}
                  className="inline-flex font-medium text-brand underline-offset-2 hover:underline"
                >
                  {block.label} →
                </Link>
              </p>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
