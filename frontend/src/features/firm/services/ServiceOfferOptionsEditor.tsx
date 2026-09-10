import type { FormChangeEvent } from '@/shared/types/react-events'
import { useMemo, useState } from 'react'
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
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Search, Trash2 } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import type { AccountingService } from '@/shared/types/contabil'
import { cn } from '@/shared/lib/utils'

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}

function SortableOptionRow({
  service,
  index,
  total,
  onMove,
  onRemove,
}: {
  service: AccountingService
  index: number
  total: number
  onMove: (id: string, dir: -1 | 1) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: service.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-background/80 px-3 py-2',
        isDragging && 'z-10 opacity-95 shadow-md ring-1 ring-brand/30',
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label={`Arrastar opção ${service.name}`}
        title="Arrastar para reordenar as opções"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-bold text-muted-foreground">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{service.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatPrice(service.priceCents || 0)} · {service.durationMinutes || 60} min
          {!service.isPubliclyListed ? ' · não publicado' : ''}
          {service.isActive === false ? ' · inactivo' : ''}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          disabled={index === 0}
          onClick={() => onMove(service.id, -1)}
          aria-label="Subir"
        >
          ↑
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          disabled={index === total - 1}
          onClick={() => onMove(service.id, 1)}
          aria-label="Descer"
        >
          ↓
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          aria-label={`Remover ${service.name}`}
          onClick={() => onRemove(service.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  )
}

/**
 * Oferta comercial: escolher serviços reais como opções do cliente.
 * Pesquisa + lista — evita dropdown gigante. Sem hierarquia recursiva.
 */
export function ServiceOfferOptionsEditor({
  currentServiceId,
  allServices,
  value,
  onChange,
}: {
  currentServiceId?: string | null
  allServices: AccountingService[]
  value: string[]
  onChange: (ids: string[]) => void
}) {
  const [query, setQuery] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const selected = useMemo(() => {
    const byId = new Map(allServices.map((s) => [s.id, s]))
    return value.map((id) => byId.get(id)).filter(Boolean) as AccountingService[]
  }, [allServices, value])

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allServices.filter((s) => {
      if (currentServiceId && s.id === currentServiceId) return false
      if (value.includes(s.id)) return false
      // Não oferecer serviços que já são ofertas (têm opções) — profundidade 1.
      if ((s.optionServiceIds || []).length > 0 || (s.options || []).length > 0) return false
      if (s.isActive === false) return false
      if (!q) return true
      return s.name.toLowerCase().includes(q)
    })
  }, [allServices, currentServiceId, value, query])

  function add(id: string) {
    if (!id || value.includes(id)) return
    onChange([...value, id])
    setQuery('')
    setPickerOpen(false)
  }

  function remove(id: string) {
    onChange(value.filter((x) => x !== id))
  }

  function move(id: string, dir: -1 | 1) {
    const idx = value.indexOf(id)
    if (idx < 0) return
    const j = idx + dir
    if (j < 0 || j >= value.length) return
    onChange(arrayMove(value, idx, j))
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = value.indexOf(String(active.id))
    const newIndex = value.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    onChange(arrayMove(value, oldIndex, newIndex))
  }

  return (
    <div className="space-y-3" data-testid="service-offer-options-editor">
      <div>
        <p className="text-sm font-medium text-foreground">Opções para o cliente</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Escolha os serviços que serão apresentados como opções dentro desta oferta. Arraste para definir a
          ordem (1 = primeira escolha). Preço, duração e agendamento vêm do serviço real seleccionado.
        </p>
      </div>

      {selected.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 bg-muted/10 px-3 py-3 text-xs text-muted-foreground">
          Nenhuma opção — este serviço funciona como oferta simples (comportamento actual).
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={value} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {selected.map((s, index) => (
                <SortableOptionRow
                  key={s.id}
                  service={s}
                  index={index}
                  total={selected.length}
                  onMove={move}
                  onRemove={remove}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {pickerOpen ? (
        <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e: FormChangeEvent) => setQuery(e.target.value)}
              placeholder="Pesquisar serviços do escritório…"
              className="h-9 rounded-lg pl-8"
              autoFocus
            />
          </div>
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
            {candidates.length === 0 ? (
              <li className="px-2 py-3 text-xs text-muted-foreground">
                {query.trim()
                  ? 'Nenhum serviço encontrado.'
                  : 'Não há mais serviços elegíveis (ou já são ofertas com opções).'}
              </li>
            ) : (
              candidates.slice(0, 40).map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-muted/40',
                    )}
                    onClick={() => add(s.id)}
                  >
                    <span className="min-w-0 truncate font-medium">{s.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatPrice(s.priceCents || 0)} · {s.durationMinutes || 60} min
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="mt-2 flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setPickerOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Adicionar opção
        </Button>
      )}
    </div>
  )
}
