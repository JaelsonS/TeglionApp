import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'

import { Checkbox } from '@/shared/components/ui/checkbox'
import { Label } from '@/shared/components/ui/label'
import type { PublicSiteSection } from '@/shared/types/firmPublicSite'
import { cn } from '@/shared/lib/utils'

type SectionMeta = {
  label: string
  hint: string
}

type Props = {
  sections: PublicSiteSection[]
  labels: Record<PublicSiteSection['type'], string>
  hints: Record<PublicSiteSection['type'], string>
  isOpen: (section: PublicSiteSection) => boolean
  onToggleOpen: (section: PublicSiteSection) => void
  onToggleEnabled: (key: string, enabled: boolean) => void
  onReorder: (activeKey: string, overKey: string) => void
  renderEditor: (section: PublicSiteSection) => ReactNode
}

function SortableSectionCard({
  section,
  index,
  meta,
  open,
  onToggleOpen,
  onToggleEnabled,
  children,
}: {
  section: PublicSiteSection
  index: number
  meta: SectionMeta
  open: boolean
  onToggleOpen: () => void
  onToggleEnabled: (enabled: boolean) => void
  children: ReactNode
}) {
  const pinned = section.type === 'header' || section.type === 'footer'
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.key,
    disabled: pinned,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-xl border border-border/50 bg-card p-4',
        isDragging && 'z-10 opacity-90 shadow-md ring-1 ring-brand/30',
      )}
    >
      <div className="mb-1 flex items-start gap-2">
        <button
          type="button"
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground',
            pinned
              ? 'cursor-not-allowed opacity-40'
              : 'cursor-grab touch-none hover:bg-muted hover:text-foreground active:cursor-grabbing',
          )}
          aria-label={pinned ? 'Posição fixa' : 'Arrastar para reordenar'}
          disabled={pinned}
          {...(pinned ? {} : { ...attributes, ...listeners })}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <Checkbox
              checked={section.enabled}
              onCheckedChange={(v: boolean | 'indeterminate') => onToggleEnabled(v === true)}
            />
            <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={onToggleOpen}>
              <span className="truncate">
                {index + 1}. {meta.label}
              </span>
              <ChevronDown
                className={cn('ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
              />
            </button>
          </Label>
          <p className="mt-1 pl-7 text-[11px] text-muted-foreground">{meta.hint}</p>
        </div>
      </div>

      {section.enabled && open ? <div className="mt-3 border-t border-border/40 pt-3">{children}</div> : null}
    </div>
  )
}

export function PublicSiteSectionsList({
  sections,
  labels,
  hints,
  isOpen,
  onToggleOpen,
  onToggleEnabled,
  onReorder,
  renderEditor,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorder(String(active.id), String(over.id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={sections.map((s) => s.key)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {sections.map((section, index) => (
            <SortableSectionCard
              key={section.key}
              section={section}
              index={index}
              meta={{ label: labels[section.type], hint: hints[section.type] }}
              open={isOpen(section)}
              onToggleOpen={() => onToggleOpen(section)}
              onToggleEnabled={(enabled) => {
                onToggleEnabled(section.key, enabled)
              }}
            >
              {renderEditor(section)}
            </SortableSectionCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
