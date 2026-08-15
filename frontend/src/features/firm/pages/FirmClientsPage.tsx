import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Link, useNavigate } from 'react-router-dom'
import {
  Archive,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LayoutGrid,
  List,
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
  Send,
  X,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  CompanyAvatar,
  companyTypePillClass,
  formatNifDisplay,
  lastActivityLabel,
  pendingObligationDot,
  resolveCompanyType,
  type CompanyTypeLabel,
} from '@/features/firm/clients/clientCompanyAvatar'
import { FirmScrollPage } from '@/features/firm/FirmPageLayout'
import { CreateCompanyWizard } from '@/features/firm/components/CreateCompanyWizard'
import { FirmClientBulkInviteDialog } from '@/features/firm/components/FirmClientBulkInviteDialog'
import { FirmTagBadge } from '@/features/firm/tags/FirmTagBadge'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { AskMayaButton } from '@/features/maya'
import { EmptyState, PageHeader } from '@/shared/design-system'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Input } from '@/shared/components/ui/input'
import { contabilClientsApi, contabilInquiryTagsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import type { Client } from '@/shared/types/clients'
import { cn } from '@/shared/lib/utils'

const PAGE_SIZE = 12

type TypeFilter = 'todos' | CompanyTypeLabel
type RegimeFilter = 'todos' | string
type EstadoFilter = 'ativos' | 'atencao' | 'inativos' | 'todos'

function estadoPill(client: Client) {
  if (client.status && client.status !== 'ACTIVE') {
    return { label: 'Inativo', className: 'cb-pill cb-pill-gray' }
  }
  const s = client.operationalStatus
  if (s === 'critico') return { label: 'Atenção', className: 'cb-pill cb-pill-orange' }
  if (s === 'atencao') return { label: 'Atenção', className: 'cb-pill cb-pill-orange' }
  return { label: 'Ativo', className: 'cb-pill cb-pill-green' }
}

function normalizeRegimeLabel(v?: string | null) {
  const s = String(v || '').trim()
  if (!s) return '—'
  if (/isen/i.test(s)) return 'Isenção'
  if (/normal/i.test(s)) return 'Normal'
  if (/trimest/i.test(s)) return 'Trimestral'
  if (/mensal/i.test(s)) return 'Mensal'
  return s
}

export function FirmClientsPage() {
  const navigate = useNavigate()

  const [items, setItems] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos')
  const [regimeFilter, setRegimeFilter] = useState<RegimeFilter>('todos')
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('ativos')
  const [tagFilter, setTagFilter] = useState('')
  const [view, setView] = useState<'list' | 'grid'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 'grid' : 'list',
  )
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedMeta, setSelectedMeta] = useState<
    Record<string, { name: string; email?: string | null }>
  >({})
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<Client | null>(null)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => {
      setIsMobile(mq.matches)
      if (mq.matches) setView('grid')
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const effectiveView = isMobile ? 'grid' : view

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = (await contabilClientsApi.list({
        page: 1,
        limit: 500,
        includeInactive: estadoFilter === 'inativos' || estadoFilter === 'todos' ? '1' : undefined,
      })) as { items?: Client[]; total?: number }
      setItems(res.items || [])
      setTotal(res.total ?? res.items?.length ?? 0)
    } catch (err) {
      toast.error('Não foi possível carregar clientes', { description: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }, [estadoFilter])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [search, typeFilter, regimeFilter, estadoFilter, tagFilter])

  const tagsQuery = useQuery({
    queryKey: ['firm-inquiry-tags'],
    queryFn: () => contabilInquiryTagsApi.list().then((r) => r.items),
  })
  const firmTags = tagsQuery.data || []

  const regimeOptions = useMemo(() => {
    const set = new Set<string>()
    for (const c of items) {
      const r = normalizeRegimeLabel(c.vatRegime || c.fiscalProfile?.vatRegime)
      if (r && r !== '—') set.add(r)
    }
    return ['Normal', 'Isenção', 'Trimestral', 'Mensal'].filter((o) => set.has(o) || set.size === 0).concat(
      [...set].filter((x) => !['Normal', 'Isenção', 'Trimestral', 'Mensal'].includes(x)),
    )
  }, [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((c) => {
      if (q) {
        const hay = [c.name, c.fullName, c.email, c.taxId, c.phone]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }

      const tipo = resolveCompanyType(c)
      if (typeFilter !== 'todos' && tipo !== typeFilter) return false

      const regime = normalizeRegimeLabel(c.vatRegime || c.fiscalProfile?.vatRegime)
      if (regimeFilter !== 'todos' && regime !== regimeFilter) return false

      const inactive = c.status && c.status !== 'ACTIVE'
      if (estadoFilter === 'ativos') {
        if (inactive) return false
        if (c.operationalStatus === 'atencao' || c.operationalStatus === 'critico') return false
      } else if (estadoFilter === 'atencao') {
        if (inactive) return false
        if (c.operationalStatus !== 'atencao' && c.operationalStatus !== 'critico') return false
      } else if (estadoFilter === 'inativos') {
        if (!inactive) return false
      }

      if (tagFilter && !(c.tags || []).some((t) => t.id === tagFilter)) return false

      return true
    })
  }, [items, search, typeFilter, regimeFilter, estadoFilter, tagFilter])

  const activeCount = useMemo(
    () => items.filter((c) => !c.status || c.status === 'ACTIVE').length,
    [items],
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const pageNumbers = useMemo(() => {
    const max = Math.min(pageCount, 5)
    const start = Math.max(1, Math.min(page, pageCount - max + 1))
    return Array.from({ length: max }, (_, i) => start + i)
  }, [page, pageCount])

  const toggleSelect = (id: string) => {
    const client = pageItems.find((c) => c._id === id)
    const willSelect = !selected.has(id)
    setSelected((prev) => {
      const next = new Set(prev)
      if (willSelect) next.add(id)
      else next.delete(id)
      return next
    })
    setSelectedMeta((prev) => {
      const next = { ...prev }
      if (!willSelect) {
        delete next[id]
      } else if (client) {
        next[id] = { name: client.fullName || client.name || id, email: client.email }
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === pageItems.length) {
      setSelected(new Set())
      setSelectedMeta({})
    } else {
      setSelected(new Set(pageItems.map((c) => c._id)))
      setSelectedMeta(
        Object.fromEntries(
          pageItems.map((c) => [c._id, { name: c.fullName || c.name || c._id, email: c.email }]),
        ),
      )
    }
  }

  const clearSelection = () => {
    setSelected(new Set())
    setSelectedMeta({})
  }

  const openHub = (id: string) => {
    navigate(`/app/firm/clients/${encodeURIComponent(id)}`)
  }

  return (
    <FirmScrollPage className="cb-clients-page">
      <div className="cb-clients-panel">
        <div className="cb-clients-panel-hd">
          <PageHeader
            title="Clientes"
            subtitle={
              filtered.length === total
                ? `Carteira do escritório · ${activeCount} clientes activos`
                : `${filtered.length} de ${total} clientes — filtre, convide ao portal e abra o hub de cada empresa.`
            }
            testId="firm-clients-header"
            secondary={
              <AskMayaButton intentId="clients" />
            }
            right={
              <Button size="sm" variant="primary" onClick={() => setOpenCreate(true)}>
                <Plus className="h-4 w-4" />
                Novo cliente
              </Button>
            }
          />
        </div>

        <div className="cb-clients-toolbar">
          <div className="cb-clients-search">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 rounded-md border-border/80 bg-card pl-8 text-xs"
              placeholder="Procurar por nome ou NIF…"
              value={search}
              onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="cb-clients-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            aria-label="Filtrar por tipo"
          >
            <option value="todos">Tipo: Todos</option>
            <option value="Lda">Lda</option>
            <option value="SA">SA</option>
            <option value="ENI">ENI</option>
            <option value="Outro">Outro</option>
          </select>

          <select
            className="cb-clients-filter"
            value={regimeFilter}
            onChange={(e) => setRegimeFilter(e.target.value)}
            aria-label="Filtrar por regime IVA"
          >
            <option value="todos">Regime: Todos</option>
            {regimeOptions.map((r) => (
              <option key={r} value={r}>
                Regime: {r}
              </option>
            ))}
          </select>

          <select
            className="cb-clients-filter"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value as EstadoFilter)}
            aria-label="Filtrar por estado"
          >
            <option value="ativos">Estado: Ativos</option>
            <option value="atencao">Estado: Atenção</option>
            <option value="inativos">Estado: Inativos</option>
            <option value="todos">Estado: Todos</option>
          </select>

          {firmTags.length > 0 ? (
            <select
              className="cb-clients-filter"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              aria-label="Filtrar por etiqueta"
            >
              <option value="">Etiqueta: Todas</option>
              {firmTags.map((t) => (
                <option key={t.id} value={t.id}>
                  Etiqueta: {t.name}
                </option>
              ))}
            </select>
          ) : null}

          <div className={cn('cb-clients-view-toggle', isMobile && 'hidden')}>
            <button
              type="button"
              className={cn('cb-clients-view-btn', view === 'list' && 'cb-clients-view-btn-active')}
              onClick={() => setView('list')}
              aria-label="Vista em lista"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn('cb-clients-view-btn', view === 'grid' && 'cb-clients-view-btn-active')}
              onClick={() => setView('grid')}
              aria-label="Vista em grelha"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {selected.size > 0 ? (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
            <span className="text-sm font-medium text-foreground">{selected.size} seleccionados</span>
            <Button type="button" size="sm" className="h-8 gap-1.5 rounded-md text-xs" onClick={() => setBulkInviteOpen(true)}>
              <Send className="h-3.5 w-3.5" />
              Gerar e enviar convite
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 rounded-md text-xs text-muted-foreground"
              onClick={clearSelection}
            >
              <X className="h-3.5 w-3.5" />
              Limpar seleção
            </Button>
          </div>
        ) : null}

        {loading ? (
          <p className="cb-dash-empty">A carregar clientes…</p>
        ) : effectiveView === 'grid' ? (
          <div className="cb-clients-grid">
            {pageItems.length === 0 ? (
              <EmptyState
                className="col-span-full"
                icon={Building2}
                title={total === 0 ? 'Ainda não tem clientes' : 'Nenhum cliente neste filtro'}
                description={
                  total === 0
                    ? 'Adicione a primeira empresa à carteira para organizar documentos, prazos e o portal do cliente.'
                    : 'Ajuste a pesquisa ou os filtros para ver outros clientes.'
                }
                action={
                  total === 0 ? (
                    <Button size="sm" variant="primary" onClick={() => setOpenCreate(true)}>
                      <Plus className="h-4 w-4" />
                      Novo cliente
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              pageItems.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  className="cb-clients-grid-card text-left"
                  onClick={() => openHub(c._id)}
                >
                  <div className="flex items-center gap-2">
                    <CompanyAvatar client={c} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.fullName || c.name}</p>
                      <p className="cb-text-caption">{formatNifDisplay(c.taxId)}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className={cn('cb-pill', companyTypePillClass(resolveCompanyType(c)))}>
                      {resolveCompanyType(c)}
                    </span>
                    <span className={cn(estadoPill(c).className)}>{estadoPill(c).label}</span>
                    {(c.tags || []).slice(0, 3).map((t) => (
                      <FirmTagBadge key={t.id} tag={t} />
                    ))}
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="cb-clients-table-wrap cb-table-scroll">
            <table className="cb-clients-table">
              <thead className="cb-clients-thead">
                <tr>
                  <th className="w-10">
                    <Checkbox
                      checked={pageItems.length > 0 && selected.size === pageItems.length}
                      onCheckedChange={() => toggleSelectAll()}
                      aria-label="Seleccionar página"
                    />
                  </th>
                  <th>Cliente</th>
                  <th className="w-20">Tipo</th>
                  <th className="w-28">Regime IVA</th>
                  <th className="w-32 text-center">Obrigações pendentes</th>
                  <th className="w-28">Última actividade</th>
                  <th className="w-24">Estado</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="cb-dash-empty">
                      Nenhum cliente neste filtro.
                      <Button className="mt-2 h-8" size="sm" onClick={() => setOpenCreate(true)}>
                        Novo cliente
                      </Button>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((c) => {
                    const tipo = resolveCompanyType(c)
                    const obCount = c.pendingObligationsCount ?? 0
                    const dot = pendingObligationDot(obCount)
                    const estado = estadoPill(c)
                    const isSelected = selected.has(c._id)

                    return (
                      <tr
                        key={c._id}
                        className={cn('cb-clients-row', isSelected && 'cb-clients-row-selected')}
                      >
                        <td>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(c._id)}
                            aria-label={`Seleccionar ${c.name}`}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="cb-clients-company-cell w-full text-left"
                            onClick={() => openHub(c._id)}
                          >
                            <CompanyAvatar client={c} />
                            <div className="cb-clients-company-meta min-w-0">
                              <p className="cb-clients-company-name">{c.fullName || c.name}</p>
                              <p className="cb-clients-company-nif">NIF {formatNifDisplay(c.taxId)}</p>
                              {(c.tags || []).length > 0 ? (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {(c.tags || []).slice(0, 3).map((t) => (
                                    <FirmTagBadge key={t.id} tag={t} />
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </button>
                        </td>
                        <td>
                          <span className={cn('cb-pill', companyTypePillClass(tipo))}>{tipo}</span>
                        </td>
                        <td className="text-xs text-foreground">
                          {normalizeRegimeLabel(c.vatRegime || c.fiscalProfile?.vatRegime)}
                        </td>
                        <td className="text-center">
                          <span className="cb-clients-ob-dot justify-center">
                            <span className={dot.className} />
                            {obCount}
                          </span>
                        </td>
                        <td className="text-xs text-muted-foreground">{lastActivityLabel(c)}</td>
                        <td>
                          <span className={cn(estado.className)}>{estado.label}</span>
                        </td>
                        <td>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => openHub(c._id)}>
                                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                Abrir cockpit
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/app/firm/messages?client=${encodeURIComponent(c._id)}`}>
                                  <MessageSquare className="mr-2 h-3.5 w-3.5" />
                                  Mensagem
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setArchiveTarget(c)}
                              >
                                <Archive className="mr-2 h-3.5 w-3.5" />
                                Arquivar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="cb-clients-footer">
          <span>
            {filtered.length === 0
              ? '0 clientes'
              : `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, filtered.length)} de ${filtered.length}`}
          </span>
          <div className="cb-clients-pagination">
            <button
              type="button"
              className="cb-clients-page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {pageNumbers.map((n) => (
              <button
                key={n}
                type="button"
                className={cn('cb-clients-page-btn', n === page && 'cb-clients-page-btn-active')}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            {pageCount > 5 ? <span className="px-1">…</span> : null}
            <button
              type="button"
              className="cb-clients-page-btn"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              aria-label="Página seguinte"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <CreateCompanyWizard open={openCreate} onOpenChange={setOpenCreate} onCreated={() => void load()} />
      <FirmClientBulkInviteDialog
        open={bulkInviteOpen}
        onOpenChange={setBulkInviteOpen}
        clientIds={[...selected]}
        clients={[...selected].map((id) => ({
          id,
          name: selectedMeta[id]?.name || items.find((c) => c._id === id)?.fullName || items.find((c) => c._id === id)?.name || id,
          email: selectedMeta[id]?.email ?? items.find((c) => c._id === id)?.email ?? null,
        }))}
        onDone={() => {
          clearSelection()
          void load()
        }}
      />
      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        testId="firm-archive-client"
        title="Remover da carteira?"
        description={
          archiveTarget
            ? `«${archiveTarget.fullName || archiveTarget.name}» deixa de aparecer na lista activa.`
            : ''
        }
        confirmLabel="Remover da carteira"
        onConfirm={async () => {
          if (!archiveTarget) return
          await contabilClientsApi.archive(archiveTarget._id)
          toast.success('Cliente removido da carteira')
          setArchiveTarget(null)
          await load()
        }}
      />
    </FirmScrollPage>
  )
}
