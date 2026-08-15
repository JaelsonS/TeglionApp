import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { contabilInquiryTagsApi } from '@/infrastructure/api'
import { cn } from '@/shared/lib/utils'

import { tagTextColor, type FirmEntityTag } from './firmTagUtils'

type Props = {
  selectedTags: FirmEntityTag[]
  disabled?: boolean
  onToggle: (tagId: string) => void
  emptyHintHref?: string
}

export function FirmEntityTagsEditor({
  selectedTags,
  disabled,
  onToggle,
  emptyHintHref = '/app/firm/settings?tab=etiquetas',
}: Props) {
  const tagsQuery = useQuery({
    queryKey: ['firm-inquiry-tags'],
    queryFn: () => contabilInquiryTagsApi.list().then((r) => r.items),
  })
  const firmTags = tagsQuery.data || []
  const activeIds = new Set(selectedTags.map((t) => t.id))

  if (firmTags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Crie etiquetas em{' '}
        <Link to={emptyHintHref} className="font-medium text-brand underline-offset-2 hover:underline">
          Definições → Etiquetas
        </Link>
        .
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {firmTags.map((tag) => {
        const active = activeIds.has(tag.id)
        return (
          <button
            key={tag.id}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(tag.id)}
            className={cn(
              'rounded-full px-2.5 py-1 text-caption font-semibold transition',
              active ? 'ring-2 ring-offset-1 ring-brand/50' : 'opacity-55 hover:opacity-100',
              disabled && 'pointer-events-none opacity-40',
            )}
            style={{ backgroundColor: tag.colorHex, color: tagTextColor(tag.colorHex) }}
          >
            {tag.name}
          </button>
        )
      })}
    </div>
  )
}
