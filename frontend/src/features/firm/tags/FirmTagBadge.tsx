import { cn } from '@/shared/lib/utils'

import { tagTextColor, type FirmEntityTag } from './firmTagUtils'

export function FirmTagBadge({ tag, className }: { tag: FirmEntityTag; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-[10rem] items-center truncate rounded-full px-2 py-0.5 text-caption font-semibold',
        className,
      )}
      style={{ backgroundColor: tag.colorHex, color: tagTextColor(tag.colorHex) }}
      title={tag.name}
    >
      {tag.name}
    </span>
  )
}
