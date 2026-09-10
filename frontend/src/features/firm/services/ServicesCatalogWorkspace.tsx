import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import {
  CheckCircle2,
  Eye,
  FolderCog,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

import { ServiceFullEditorSheet } from '@/features/firm/services/ServiceFullEditorSheet'
import { ServiceGroupsManager } from '@/features/firm/services/ServiceGroupsManager'
import { getServicePublishPresentation } from '@/features/firm/services/servicePublishState'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { EmptyState } from '@/shared/design-system'
import { useAuth } from '@/shared/hooks/useAuth'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import type { AccountingService, ConsultingCatalogEntry } from '@/shared/types/contabil'
import type { FormChangeEvent } from '@/shared/types/react-events'

type FilterMode = 'all' | 'active' | 'inactive'

function formatEur(cents: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100)
}

function isIrsEntry(s: { name: string; catalogKey?: string | null; category?: string }) {
  if (s.category === 'IRS') return true
  const blob = `${s.name} ${s.catalogKey || ''}`
  return /\birs\b/i.test(blob) || /e-?fatura/i.test(blob) || /^irs-/.test(s.catalogKey || '')
}

function optionIdsOf(s: AccountingService): string[] {
  if (s.optionServiceIds?.length) return s.optionServiceIds
  return (s.options || []).map((o) => o.id).filter(Boolean)
}

function buildParentByChildId(all: AccountingService[]): Map<string, AccountingService> {
  const map = new Map<string, AccountingService>()
  for (const s of all) {
    for (const id of optionIdsOf(s)) {
      if (!map.has(id)) map.set(id, s)
    }
  }
  return map
}

type Props = {
  services: AccountingService[]
  isLoading?: boolean
  onReload: () => void
  /** Catálogo geral exclui IRS (vão para /app/firm/irs). */
  excludeIrs?: boolean
  title?: string
  description?: string
}

function SortableServiceRow({
  service,
  index,
  publicRank,
  parentName,
  optionNames,
  busy,
  canReorder,
  firmSlug,
  isFirst,
  isLast,
  onMove,
  onToggleActive,
  onEdit,
}: {
  service: AccountingService
  index: number
  /** Posição na página pública entre cartões de topo (null = não aparece como cartão). */
  publicRank: number | null
  parentName: string | null
  optionNames: string[]
  busy: boolean
  canReorder: boolean
  firmSlug?: string
  isFirst: boolean
  isLast: boolean
  onMove: (direction: -1 | 1) => void
  onToggleActive: () => void
  onEdit: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: service.id,
    disabled: !canReorder || busy,
  })
  const active = service.isActive !== false
  const publish = getServicePublishPresentation(service)
  const isOffer = optionNames.length > 0
  const isNestedOption = Boolean(parentName)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-stretch gap-0 border-b border-border/40 hover:bg-brand/[0.03]',
        isDragging && 'z-10 bg-card opacity-95 shadow-md ring-1 ring-brand/30',
        isNestedOption && 'bg-muted/20',
      )}
    >
      {canReorder ? (
        <button
          type="button"
          className={cn(
            'flex w-9 shrink-0 cursor-grab touch-none flex-col items-center justify-center gap-0.5 border-r border-border/40 text-muted-foreground',
            'hover:bg-muted/60 hover:text-foreground active:cursor-grabbing',
            busy && 'pointer-events-none opacity-40',
          )}
          aria-label={`Arrastar para reordenar: ${service.name}`}
          title="Arrastar para mudar a ordem na página pública"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <div className="w-9 shrink-0 border-r border-border/40" aria-hidden />
      )}

      <div className={cn('flex min-w-0 flex-1 items-center gap-3 px-3 py-3', isNestedOption && 'pl-2')}>
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg text-center',
            publicRank != null
              ? 'bg-brand/10 text-brand'
              : isNestedOption
                ? 'bg-muted text-muted-foreground'
                : 'bg-muted/60 text-muted-foreground',
          )}
          title={
            publicRank != null
              ? `${publicRank}º cartão na página pública`
              : isNestedOption
                ? 'Aparece dentro da oferta (não como cartão separado)'
                : 'Ordem na lista'
          }
        >
          {publicRank != null ? (
            <span className="text-xs font-bold leading-none">{publicRank}º</span>
          ) : isNestedOption ? (
            <span className="text-xs font-semibold">↳</span>
          ) : (
            <span className="text-xs font-semibold">{index + 1}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">{service.name}</p>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-caption font-bold uppercase',
                active ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground',
              )}
            >
              {active ? 'Activo' : 'Inactivo'}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-caption font-bold uppercase',
                publish.id === 'published'
                  ? 'bg-sky-100 text-sky-900'
                  : publish.id === 'ready'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-muted text-muted-foreground',
              )}
              title={publish.description}
            >
              {publish.label}
            </span>
            {isOffer ? (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-caption font-bold uppercase text-violet-900">
                Oferta · {optionNames.length} {optionNames.length === 1 ? 'opção' : 'opções'}
              </span>
            ) : null}
            {isNestedOption ? (
              <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-caption font-medium text-slate-700">
                Dentro de «{parentName}»
              </span>
            ) : null}
            {publicRank === 1 ? (
              <span className="rounded-full bg-brand/15 px-2 py-0.5 text-caption font-bold text-brand">
                Aparece primeiro
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {service.durationMinutes} min · {formatEur(service.priceCents)}
            {service.publicGroup ? ` · ${service.publicGroup}` : ''}
            {service.requiresBooking ? ' · com agendamento' : ' · sem agendamento'}
          </p>
          {isOffer ? (
            <p className="mt-1 text-caption text-muted-foreground">
              Opções: {optionNames.join(' · ')}
            </p>
          ) : null}
          {publish.id === 'draft' || publish.id === 'ready' ? (
            <p className="mt-1 text-caption text-amber-800 dark:text-amber-400">{publish.description}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {canReorder ? (
            <>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Subir na Página Pública"
                disabled={busy || isFirst}
                onClick={() => onMove(-1)}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Descer na Página Pública"
                disabled={busy || isLast}
                onClick={() => onMove(1)}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            title={active ? 'Desactivar' : 'Activar'}
            disabled={busy}
            onClick={onToggleActive}
          >
            {active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
          </Button>
          {firmSlug && service.slug && service.isPubliclyListed ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title="Ver página pública"
              onClick={() =>
                window.open(`/${firmSlug}/servicos/${service.slug}`, '_blank', 'noopener,noreferrer')
              }
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8 border-brand/30 text-brand"
            title="Editar completo (banner, formulário, publicação…)"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </li>
  )
}

export function ServicesCatalogWorkspace({
  services,
  isLoading,
  onReload,
  excludeIrs = true,
  title = 'Os vossos serviços',
  description,
}: Props) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const firmSlug = user?.tenant?.slug
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterMode>('active')
  const [modelSearch, setModelSearch] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingService, setEditingService] = useState<AccountingService | null>(null)
  const [catalogHint, setCatalogHint] = useState<{ name?: string; catalogKey?: string } | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [groupsManagerOpen, setGroupsManagerOpen] = useState(false)

  const catalogQuery = useQuery({
    queryKey: ['contabil-accounting-services', 'catalog-template'],
    queryFn: () => contabilAccountingServicesApi.getCatalogTemplate(),
    staleTime: 10 * 60_000,
  })

  const groupsQuery = useQuery({
    queryKey: ['contabil-accounting-service-groups'],
    queryFn: () => contabilAccountingServicesApi.listGroups(),
    staleTime: 30_000,
  })
  const groups = groupsQuery.data?.items ?? []

  const parentByChildId = useMemo(() => buildParentByChildId(services), [services])

  const firmServices = useMemo(() => {
    let list = excludeIrs ? services.filter((s) => !isIrsEntry(s)) : services
    if (filter === 'active') list = list.filter((s) => s.isActive !== false)
    if (filter === 'inactive') list = list.filter((s) => s.isActive === false)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.catalogKey || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [services, excludeIrs, filter, search])

  /** Cartões de topo na página pública (activos + públicos + não são opção de outra oferta). */
  const publicTopLevelIds = useMemo(() => {
    const ids: string[] = []
    for (const s of firmServices) {
      if (s.isActive === false) continue
      if (!s.isPubliclyListed) continue
      if (parentByChildId.has(s.id)) continue
      ids.push(s.id)
    }
    return ids
  }, [firmServices, parentByChildId])

  const publicRankById = useMemo(() => {
    const map = new Map<string, number>()
    publicTopLevelIds.forEach((id, i) => map.set(id, i + 1))
    return map
  }, [publicTopLevelIds])

  const existingKeys = useMemo(
    () => new Set(services.map((s) => s.catalogKey).filter(Boolean) as string[]),
    [services],
  )

  const models = useMemo(() => {
    let items = (catalogQuery.data?.items ?? []).filter((t) => !existingKeys.has(t.catalogKey))
    if (excludeIrs) items = items.filter((t) => !isIrsEntry(t))
    const q = modelSearch.trim().toLowerCase()
    if (q) items = items.filter((t) => t.name.toLowerCase().includes(q) || t.catalogKey.includes(q))
    return items
  }, [catalogQuery.data, existingKeys, excludeIrs, modelSearch])

  const openEditor = (s: AccountingService | null, hint?: { name?: string; catalogKey?: string } | null) => {
    setEditingService(s)
    setCatalogHint(hint ?? null)
    setEditorOpen(true)
  }

  const canReorder = !search.trim() && filter !== 'inactive'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const persistOrder = async (ordered: AccountingService[]) => {
    const first = ordered[0]
    if (!first) return
    setBusyKey(first.id)
    try {
      await Promise.all(
        ordered.map((s, i) => contabilAccountingServicesApi.patch(s.id, { sortOrder: (i + 1) * 10 })),
      )
      await onReload()
    } catch (err) {
      toast.error('Não foi possível reordenar', { description: getErrorMessage(err) })
    } finally {
      setBusyKey(null)
    }
  }

  const moveService = async (index: number, direction: -1 | 1) => {
    const other = index + direction
    if (other < 0 || other >= firmServices.length) return
    const ordered = arrayMove(firmServices, index, other)
    await persistOrder(ordered)
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = firmServices.findIndex((s) => s.id === active.id)
    const newIndex = firmServices.findIndex((s) => s.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    void persistOrder(arrayMove(firmServices, oldIndex, newIndex))
  }

  const activate = async (entry: ConsultingCatalogEntry) => {
    setBusyKey(entry.catalogKey)
    try {
      const res = await contabilAccountingServicesApi.activateCatalog([entry.catalogKey])
      toast.success(`“${entry.name}” activado — personalize agora`)
      await onReload()
      const created =
        (res as { items?: AccountingService[] })?.items?.[0] ||
        (await contabilAccountingServicesApi.list())?.items?.find(
          (s: AccountingService) => s.catalogKey === entry.catalogKey,
        )
      if (created) {
        openEditor(created)
      }
    } catch (err) {
      toast.error('Não foi possível activar', { description: getErrorMessage(err) })
    } finally {
      setBusyKey(null)
    }
  }

  const toggleActive = async (s: AccountingService) => {
    setBusyKey(s.id)
    try {
      await contabilAccountingServicesApi.patch(s.id, { isActive: s.isActive === false })
      toast.success(s.isActive === false ? 'Serviço activado' : 'Serviço desactivado')
      await onReload()
    } catch (err) {
      toast.error('Erro ao actualizar', { description: getErrorMessage(err) })
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {description ? (
        <p className="shrink-0 text-sm text-muted-foreground">{description}</p>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-brand/20 bg-card shadow-sm">
          <div className="shrink-0 space-y-3 border-b border-brand/10 bg-gradient-to-r from-brand/[0.06] to-transparent px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{title}</h3>
              <div className="flex items-center gap-1.5">
                <Button type="button" size="sm" variant="outline" onClick={() => setGroupsManagerOpen(true)}>
                  <FolderCog className="h-4 w-4" /> Grupos
                </Button>
                <Button type="button" size="sm" variant="primary" onClick={() => openEditor(null)}>
                  <Plus className="h-4 w-4" /> Adicionar serviço
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Arraste pela pega à esquerda para mudar a ordem. O número com «º» é a posição do cartão na página
              pública (1º aparece primeiro). Serviços «Dentro de…» são opções de uma oferta — não saem como cartão
              separado.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[10rem] flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 rounded-lg border-brand/20 pl-8 text-xs"
                  placeholder="Filtrar por nome…"
                  value={search}
                  onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
                />
              </div>
              {(['active', 'all', 'inactive'] as FilterMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilter(mode)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-semibold transition',
                    filter === mode
                      ? 'bg-brand text-white hover:bg-brand/90 hover:text-white'
                      : 'bg-muted/40 text-muted-foreground hover:text-foreground',
                  )}
                >
                  {mode === 'active' ? 'Activos' : mode === 'inactive' ? 'Inactivos' : 'Todos'}
                </button>
              ))}
            </div>
            {search.trim() ? (
              <p className="text-[11px] text-amber-800">
                Limpe a pesquisa para poder arrastar e reordenar.
              </p>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-brand" />
              </div>
            ) : firmServices.length === 0 ? (
              <EmptyState
                className="m-3 border-0 bg-transparent"
                icon={Sparkles}
                title={
                  (excludeIrs ? services.filter((s) => !isIrsEntry(s)) : services).length === 0
                    ? 'Comece pelos serviços que o escritório mais presta'
                    : 'Nenhum serviço neste filtro'
                }
                description={
                  (excludeIrs ? services.filter((s) => !isIrsEntry(s)) : services).length === 0
                    ? 'Crie um serviço, configure-o e publique-o na página pública para potenciais clientes poderem solicitar.'
                    : 'Altere o filtro (Activos / Inactivos / Todos) ou adicione um novo serviço.'
                }
                action={
                  <Button type="button" size="sm" variant="primary" onClick={() => openEditor(null)}>
                    <Plus className="h-4 w-4" />
                    {(excludeIrs ? services.filter((s) => !isIrsEntry(s)) : services).length === 0
                      ? 'Criar primeiro serviço'
                      : 'Adicionar serviço'}
                  </Button>
                }
              />
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext
                  items={firmServices.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul>
                    {firmServices.map((s, index) => {
                      const parent = parentByChildId.get(s.id) ?? null
                      const childIds = optionIdsOf(s)
                      const optionNames = childIds
                        .map((id) => services.find((x) => x.id === id)?.name)
                        .filter(Boolean) as string[]
                      return (
                        <SortableServiceRow
                          key={s.id}
                          service={s}
                          index={index}
                          publicRank={publicRankById.get(s.id) ?? null}
                          parentName={parent?.name ?? null}
                          optionNames={optionNames}
                          busy={busyKey === s.id}
                          canReorder={canReorder}
                          firmSlug={firmSlug}
                          isFirst={index === 0}
                          isLast={index === firmServices.length - 1}
                          onMove={(dir) => void moveService(index, dir)}
                          onToggleActive={() => void toggleActive(s)}
                          onEdit={() => openEditor(s)}
                        />
                      )
                    })}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-brand/20 bg-card shadow-sm">
          <div className="shrink-0 space-y-3 border-b border-brand/10 bg-gradient-to-r from-sky-500/[0.07] to-transparent px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold">Modelos Teglion</h3>
              <p className="text-xs text-muted-foreground">
                Active um modelo — abre de seguida o editor completo para personalizar.
              </p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 rounded-lg border-brand/20 pl-8 text-xs"
                placeholder="Pesquisar modelos…"
                value={modelSearch}
                onChange={(e: FormChangeEvent) => setModelSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {catalogQuery.isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-brand" />
              </div>
            ) : models.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-600/60" />
                <p className="text-sm text-muted-foreground">Já activou todos os modelos disponíveis neste filtro.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {models.map((t) => (
                  <li key={t.catalogKey} className="flex items-center gap-3 px-4 py-3 hover:bg-sky-50/40">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{t.name}</p>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-caption font-bold uppercase text-amber-900">
                          Sugestão
                        </span>
                        {t.category ? (
                          <span className="text-caption text-muted-foreground">{t.category}</span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t.durationMinutes} min · {formatEur(t.priceCents)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 rounded-full bg-brand"
                      disabled={busyKey === t.catalogKey}
                      onClick={() => void activate(t)}
                    >
                      {busyKey === t.catalogKey ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        'Activar e editar'
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <ServiceFullEditorSheet
        service={editingService}
        open={editorOpen}
        catalogServices={services}
        initialCatalogHint={catalogHint}
        onOpenChange={(open) => {
          setEditorOpen(open)
          if (!open) {
            setEditingService(null)
            setCatalogHint(null)
          }
        }}
        onSaved={() => void onReload()}
      />

      <ServiceGroupsManager
        open={groupsManagerOpen}
        onOpenChange={setGroupsManagerOpen}
        groups={groups}
        onReload={async () => {
          await qc.invalidateQueries({ queryKey: ['contabil-accounting-service-groups'] })
          await onReload()
        }}
      />
    </div>
  )
}
