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
import { ChevronRight, GripVertical, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import type { PublicSiteSection } from '@/shared/types/firmPublicSite'
import { cn } from '@/shared/lib/utils'
import {
  isRemovablePublicSiteSection,
  resolvePublicSiteSectionLabel,
} from './publicSiteSectionFactory'

type Props = {
  sections: PublicSiteSection[]
  labels: Record<PublicSiteSection['type'], string>
  hints: Record<PublicSiteSection['type'], string>
  isOpen: (section: PublicSiteSection) => boolean
  onToggleOpen: (section: PublicSiteSection) => void
  onToggleEnabled: (key: string, enabled: boolean) => void
  onReorder: (activeKey: string, overKey: string) => void
  onRemove?: (key: string) => void
  renderEditor: (section: PublicSiteSection) => ReactNode
}

function SortableSectionCard({
  section,
  index,
  label,
  hint,
  open,
  removable,
  onToggleOpen,
  onToggleEnabled,
  onRemove,
  children,
}: {
  section: PublicSiteSection
  index: number
  label: string
  hint: string
  open: boolean
  removable: boolean
  onToggleOpen: () => void
  onToggleEnabled: (enabled: boolean) => void
  onRemove?: () => void
  children: ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.key,
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
        'rounded-xl border border-border/50 bg-card',
        isDragging && 'z-10 opacity-90 shadow-md ring-1 ring-brand/30',
      )}
    >
      <div className="flex items-stretch gap-0">
        <button
          type="button"
          className={cn(
            'flex w-10 shrink-0 cursor-grab touch-none flex-col items-center justify-center gap-0.5 border-r border-border/40 text-muted-foreground',
            'hover:bg-muted/60 hover:text-foreground active:cursor-grabbing',
          )}
          aria-label={`Arrastar para reordenar: ${label}`}
          title="Arrastar para mudar a ordem"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-4" aria-hidden />
        </button>

        <div className="min-w-0 flex-1 p-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={section.enabled}
              onCheckedChange={(v: boolean | 'indeterminate') => onToggleEnabled(v === true)}
              aria-label={`Activar ${label}`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {index + 1}. {label}
              </p>
              <p className="text-[11px] text-muted-foreground">{hint}</p>
            </div>
            {removable && onRemove ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Apagar ${label}`}
                title="Apagar esta secção"
                onClick={onRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
            <button
              type="button"
              onClick={onToggleOpen}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/50 text-muted-foreground',
                'hover:bg-muted hover:text-foreground',
                open && 'border-brand/30 bg-brand/5 text-foreground',
              )}
              aria-expanded={open}
              aria-label={open ? `Fechar ${label}` : `Abrir ${label}`}
              title={open ? 'Fechar opções' : 'Abrir opções'}
            >
              <ChevronRight
                className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-90')}
                aria-hidden
              />
            </button>
          </div>
        </div>
      </div>

      {section.enabled && open ? (
        <div className="border-t border-border/40 px-3 pb-3 pt-3">{children}</div>
      ) : null}
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
  onRemove,
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
          {sections.map((section, index) => {
            const label = resolvePublicSiteSectionLabel(section, labels, index)
            const hint = section.custom
              ? 'Secção criada por si — título, cores, serviços e botões'
              : hints[section.type]
            return (
              <SortableSectionCard
                key={section.key}
                section={section}
                index={index}
                label={label}
                hint={hint}
                open={isOpen(section)}
                removable={isRemovablePublicSiteSection(section)}
                onToggleOpen={() => onToggleOpen(section)}
                onToggleEnabled={(enabled) => {
                  onToggleEnabled(section.key, enabled)
                }}
                onRemove={onRemove ? () => onRemove(section.key) : undefined}
              >
                {renderEditor(section)}
              </SortableSectionCard>
            )
          })}
        </div>
      </SortableContext>
    </DndContext>
  )
}
