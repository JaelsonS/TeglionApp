import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Archive,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Loader2,
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
  Send,
  X,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { CLIENTS_CSV_IMPORT_OPEN_EVENT } from '@/features/firm/clients/openClientsCsvImport'
import { resolvePortalInviteUi } from '@/features/firm/clients/portalInviteStatus'
import {
  CLIENTS_KPI_ICONS,
  type ClientsKpi,
  type ClientsKpiId,
} from '@/features/firm/clients/ClientsKpiStrip'
import { ClientsSpreadsheetDialog } from '@/features/firm/clients/ClientsSpreadsheetDialog'
import { ClientsWorkspaceShell } from '@/features/firm/clients/ClientsWorkspaceShell'
import { CreateCompanyWizard } from '@/features/firm/components/CreateCompanyWizard'
import { FirmClientBulkInviteDialog } from '@/features/firm/components/FirmClientBulkInviteDialog'
import { FirmClientInviteButton } from '@/features/firm/components/FirmClientInviteButton'
import { FirmClientAccessManager } from '@/features/firm/components/FirmClientAccessManager'
import { FirmTagBadge } from '@/features/firm/tags/FirmTagBadge'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { AskMayaButton } from '@/features/maya'
import { EmptyState } from '@/shared/design-system'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Input } from '@/shared/components/ui/input'
import { contabilClientsApi, contabilInquiryTagsApi } from '@/infrastructure/api'
import { useFirmClientsDirectory } from '@/shared/hooks/queries/useFirmClientsDirectory'
import { queryKeys } from '@/shared/hooks/queries/queryKeys'
import { useAuth } from '@/shared/hooks/useAuth'
import { getErrorMessage } from '@/shared/utils/errors'
import type { Client } from '@/shared/types/clients'
import { cn } from '@/shared/lib/utils'

const PAGE_SIZE = 12

type TypeFilter = 'todos' | CompanyTypeLabel
type RegimeFilter = 'todos' | string
type EstadoFilter = 'ativos' | 'atencao' | 'inativos' | 'todos'
type PortalFilter = 'todos' | 'sem_portal'

function isWithoutPortal(client: Client) {
  const portal = client.portalAccessStatus
  return !portal || portal === 'NO_ACCESS' || portal === 'PENDING_INVITE'
}

function estadoPill(client: Client) {
  if (client.status && client.status !== 'ACTIVE') {
    return { label: 'Inactivo', className: 'cb-pill cb-pill-gray' }
  }
  const s = client.operationalStatus
  if (s === 'critico' || s === 'atencao') {
    return { label: 'Atenção', className: 'cb-pill cb-pill-orange' }
  }
  return { label: 'Activo', className: 'cb-pill cb-pill-green' }
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

export function ClientsWorkspace() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const tenantSlug = user?.tenant?.slug ?? ''
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const openCreate = searchParams.get('create') === '1'
  const setOpenCreate = (open: boolean) => {
    const next = new URLSearchParams(searchParams)
    if (open) next.set('create', '1')
    else next.delete('create')
    setSearchParams(next, { replace: true })
  }

  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos')
  const [regimeFilter, setRegimeFilter] = useState<RegimeFilter>('todos')
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('ativos')
  const [portalFilter, setPortalFilter] = useState<PortalFilter>('todos')
  const [tagFilter, setTagFilter] = useState('')
  const [view, setView] = useState<'cards' | 'table'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
      ? 'cards'
      : 'table',
  )
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedMeta, setSelectedMeta] = useState<
    Record<string, { name: string; email?: string | null }>
  >({})
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<Client | null>(null)
  const [spreadsheetOpen, setSpreadsheetOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  )

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => {
      setIsMobile(mq.matches)
      if (mq.matches) setView('cards')
      else setView((v) => (v === 'cards' ? 'table' : v))
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const onCsv = () => setSpreadsheetOpen(true)
    window.addEventListener(CLIENTS_CSV_IMPORT_OPEN_EVENT, onCsv)
    return () => window.removeEventListener(CLIENTS_CSV_IMPORT_OPEN_EVENT, onCsv)
  }, [])

  const effectiveView = isMobile ? 'cards' : view
  const includeInactive = estadoFilter === 'inativos' || estadoFilter === 'todos'
  const clientsQuery = useFirmClientsDirectory({ limit: 500, includeInactive })
  const items = clientsQuery.data?.items || []
  const total = clientsQuery.data?.total ?? items.length
  const loading = clientsQuery.isLoading
  const refreshClients = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.firmClientsDirectoryRoot(tenantSlug) })
  }, [queryClient, tenantSlug])

  useEffect(() => {
    if (!clientsQuery.isError) return
    toast.error('Não foi possível carregar clientes', {
      description: getErrorMessage(clientsQuery.error),
    })
  }, [clientsQuery.isError, clientsQuery.error])

  useEffect(() => {
    setPage(1)
  }, [searchDebounced, typeFilter, regimeFilter, estadoFilter, portalFilter, tagFilter])

  const tagsQuery = useQuery({
    queryKey: ['firm-inquiry-tags'],
    queryFn: () => contabilInquiryTagsApi.list().then((r) => r.items),
  })
  const firmTags = Array.isArray(tagsQuery.data) ? tagsQuery.data : []

  const regimeOptions = useMemo(() => {
    const set = new Set<string>()
    for (const c of items) {
      const r = normalizeRegimeLabel(c.vatRegime || c.fiscalProfile?.vatRegime)
      if (r && r !== '—') set.add(r)
    }
    return ['Normal', 'Isenção', 'Trimestral', 'Mensal']
      .filter((o) => set.has(o) || set.size === 0)
      .concat([...set].filter((x) => !['Normal', 'Isenção', 'Trimestral', 'Mensal'].includes(x)))
  }, [items])

  const filtered = useMemo(() => {
    const q = searchDebounced.toLowerCase()
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
      } else if (estadoFilter === 'atencao') {
        if (inactive) return false
        if (c.operationalStatus !== 'atencao' && c.operationalStatus !== 'critico') return false
      } else if (estadoFilter === 'inativos') {
        if (!inactive) return false
      }

      if (portalFilter === 'sem_portal' && !isWithoutPortal(c)) return false

      if (tagFilter && !(c.tags || []).some((t) => t.id === tagFilter)) return false

      return true
    })
  }, [items, searchDebounced, typeFilter, regimeFilter, estadoFilter, portalFilter, tagFilter])

  const filterCounts = useMemo(() => {
    const q = searchDebounced.toLowerCase()
    const base = items.filter((c) => {
      if (!q) return true
      const hay = [c.name, c.fullName, c.email, c.taxId, c.phone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })

    let ativos = 0
    let atencao = 0
    let inativos = 0
    let semPortal = 0
    const byType: Record<CompanyTypeLabel, number> = { Lda: 0, SA: 0, ENI: 0, Outro: 0 }

    for (const c of base) {
      const inactive = c.status && c.status !== 'ACTIVE'
      if (inactive) inativos += 1
      else {
        ativos += 1
        if (c.operationalStatus === 'atencao' || c.operationalStatus === 'critico') atencao += 1
      }
      if (isWithoutPortal(c)) semPortal += 1
      byType[resolveCompanyType(c)] += 1
    }

    return {
      ativos,
      atencao,
      inativos,
      todos: base.length,
      semPortal,
      byType,
    }
  }, [items, searchDebounced])

  const activeCount = useMemo(
    () => items.filter((c) => !c.status || c.status === 'ACTIVE').length,
    [items],
  )

  const kpis = useMemo((): ClientsKpi[] => {
    let attention = 0
    let noPortal = 0
    for (const c of items) {
      const inactive = c.status && c.status !== 'ACTIVE'
      if (!inactive && (c.operationalStatus === 'atencao' || c.operationalStatus === 'critico')) {
        attention += 1
      }
      if (isWithoutPortal(c)) noPortal += 1
    }
    return [
      {
        id: 'active',
        value: activeCount,
        label: activeCount === 1 ? 'activo' : 'activos',
        tone: 'emerald',
        icon: CLIENTS_KPI_ICONS.active,
      },
      {
        id: 'attention',
        value: attention,
        label: 'em atenção',
        tone: attention > 0 ? 'amber' : 'muted',
        icon: CLIENTS_KPI_ICONS.attention,
      },
      {
        id: 'portal',
        value: noPortal,
        label: noPortal === 1 ? 'sem portal' : 'sem portal',
        tone: noPortal > 0 ? 'rose' : 'muted',
        icon: CLIENTS_KPI_ICONS.noPortal,
      },
      {
        id: 'total',
        value: total,
        label: total === 1 ? 'na carteira' : 'na carteira',
        tone: 'brand',
        icon: CLIENTS_KPI_ICONS.total,
      },
    ]
  }, [items, activeCount, total])

  const activeKpiId = useMemo((): ClientsKpiId | null => {
    if (portalFilter === 'sem_portal') return 'portal'
    if (estadoFilter === 'atencao' && portalFilter === 'todos') return 'attention'
    if (estadoFilter === 'ativos' && portalFilter === 'todos') return 'active'
    if (estadoFilter === 'todos' && portalFilter === 'todos') return 'total'
    return null
  }, [estadoFilter, portalFilter])

  const applyKpiFilter = useCallback((id: ClientsKpiId) => {
    if (id === 'active') {
      setEstadoFilter('ativos')
      setPortalFilter('todos')
    } else if (id === 'attention') {
      setEstadoFilter('atencao')
      setPortalFilter('todos')
    } else if (id === 'portal') {
      setEstadoFilter('todos')
      setPortalFilter('sem_portal')
    } else {
      setEstadoFilter('todos')
      setPortalFilter('todos')
    }
    setPage(1)
  }, [])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const pageNumbers = useMemo(() => {
    const max = Math.min(pageCount, 5)
    const start = Math.max(1, Math.min(page, pageCount - max + 1))
    return Array.from({ length: max }, (_, i) => start + i)
  }, [page, pageCount])

  const rememberSelection = (client: Client, willSelect: boolean) => {
    setSelectedMeta((prev) => {
      const next = { ...prev }
      if (!willSelect) {
        delete next[client._id]
      } else {
        next[client._id] = {
          name: client.fullName || client.name || client._id,
          email: client.email,
        }
      }
      return next
    })
  }

  const toggleSelect = (id: string) => {
    const client = pageItems.find((c) => c._id === id) || items.find((c) => c._id === id)
    const willSelect = !selected.has(id)
    setSelected((prev) => {
      const next = new Set(prev)
      if (willSelect) next.add(id)
      else next.delete(id)
      return next
    })
    if (client) rememberSelection(client, willSelect)
    else if (!willSelect) {
      setSelectedMeta((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const toggleSelectAll = () => {
    if (selected.size === pageItems.length && pageItems.every((c) => selected.has(c._id))) {
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

  const hasActiveSecondaryFilters =
    typeFilter !== 'todos' || regimeFilter !== 'todos' || Boolean(tagFilter)

  const clearSecondaryFilters = () => {
    setTypeFilter('todos')
    setRegimeFilter('todos')
    setTagFilter('')
  }

  const headerRight = (
    <div className="flex flex-wrap items-center gap-2">
      <AskMayaButton />
      <Button size="sm" variant="outline" onClick={() => setSpreadsheetOpen(true)}>
        <FileSpreadsheet className="h-4 w-4" />
        Ficha CSV
      </Button>
      <Button size="sm" variant="primary" onClick={() => setOpenCreate(true)}>
        <Plus className="h-4 w-4" />
        Novo cliente
      </Button>
    </div>
  )

  const emptyTitle = total === 0 ? 'Ainda não tem clientes' : 'Nenhum cliente neste filtro'
  const emptyDescription =
    total === 0
      ? 'Adicione a primeira empresa à carteira para organizar documentos, prazos e o portal do cliente.'
      : 'Ajuste a pesquisa ou os filtros para ver outros clientes.'

  return (
    <>
      <ClientsWorkspaceShell
        headerRight={headerRight}
        kpis={kpis}
        activeKpiId={activeKpiId}
        onKpiSelect={applyKpiFilter}
      >
        <div className="cb-clients-toolbar">
          <div className="cb-clients-search">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 rounded-md border-border/80 bg-card pl-8 text-xs"
              placeholder="Procurar por nome ou NIF…"
              value={search}
              onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
              aria-label="Procurar clientes"
            />
          </div>

          <div className="cb-clients-health-filters" role="group" aria-label="Filtrar por estado">
            {(
              [
                { id: 'ativos' as const, label: 'Activos', count: filterCounts.ativos },
                { id: 'atencao' as const, label: 'Atenção', count: filterCounts.atencao },
                { id: 'inativos' as const, label: 'Inactivos', count: filterCounts.inativos },
                { id: 'todos' as const, label: 'Todos', count: filterCounts.todos },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={cn(
                  'cb-clients-health-chip',
                  `cb-clients-health-chip--${chip.id}`,
                  estadoFilter === chip.id &&
                    portalFilter === 'todos' &&
                    'cb-clients-health-chip--active',
                )}
                onClick={() => {
                  setEstadoFilter(chip.id)
                  setPortalFilter('todos')
                }}
              >
                {chip.label}
                <span className="cb-clients-health-chip-count">{chip.count}</span>
              </button>
            ))}
            <button
              type="button"
              className={cn(
                'cb-clients-health-chip cb-clients-health-chip--portal',
                portalFilter === 'sem_portal' && 'cb-clients-health-chip--active',
              )}
              onClick={() => {
                setPortalFilter((prev) => (prev === 'sem_portal' ? 'todos' : 'sem_portal'))
                if (portalFilter !== 'sem_portal') setEstadoFilter('todos')
              }}
            >
              Sem portal
              <span className="cb-clients-health-chip-count">{filterCounts.semPortal}</span>
            </button>
          </div>

          <select
            className="cb-clients-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            aria-label="Filtrar por tipo"
          >
            <option value="todos">Tipo: Todos</option>
            <option value="Lda">Lda ({filterCounts.byType.Lda})</option>
            <option value="SA">SA ({filterCounts.byType.SA})</option>
            <option value="ENI">ENI ({filterCounts.byType.ENI})</option>
            <option value="Outro">Outro ({filterCounts.byType.Outro})</option>
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
                  {t.name}
                </option>
              ))}
            </select>
          ) : null}

          {hasActiveSecondaryFilters ? (
            <button
              type="button"
              className="cb-clients-clear-filters"
              onClick={clearSecondaryFilters}
            >
              Limpar
            </button>
          ) : null}

          <div className={cn('cb-clients-view-toggle', isMobile && 'hidden')}>
            <button
              type="button"
              className={cn('cb-clients-view-btn', view === 'table' && 'cb-clients-view-btn-active')}
              onClick={() => setView('table')}
              aria-label="Vista em tabela"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn('cb-clients-view-btn', view === 'cards' && 'cb-clients-view-btn-active')}
              onClick={() => setView('cards')}
              aria-label="Vista em cartões"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {selected.size > 0 ? (
          <div className="cb-clients-bulk-bar">
            <span className="text-sm font-medium text-foreground">{selected.size} seleccionados</span>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 rounded-md text-xs"
              onClick={() => setBulkInviteOpen(true)}
            >
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
              Limpar selecção
            </Button>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar clientes…
          </div>
        ) : effectiveView === 'cards' ? (
          <div className="cb-clients-list">
            {pageItems.length === 0 ? (
              <EmptyState
                icon={Building2}
                title={emptyTitle}
                description={emptyDescription}
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
              <div className="space-y-2 pb-2">
                <div className="cb-clients-select-all">
                  <Checkbox
                    checked={pageItems.length > 0 && pageItems.every((c) => selected.has(c._id))}
                    onCheckedChange={() => toggleSelectAll()}
                    aria-label="Seleccionar página"
                  />
                  <span className="text-xs text-muted-foreground">Seleccionar nesta página</span>
                </div>
                {pageItems.map((c) => {
                  const tipo = resolveCompanyType(c)
                  const estado = estadoPill(c)
                  const portal = resolvePortalInviteUi(c)
                  const obCount = c.pendingObligationsCount ?? 0
                  const dot = pendingObligationDot(obCount)
                  const isSelected = selected.has(c._id)
                  const regime = normalizeRegimeLabel(c.vatRegime || c.fiscalProfile?.vatRegime)

                  return (
                    <article
                      key={c._id}
                      className={cn('cb-clients-card', isSelected && 'cb-clients-card--selected')}
                    >
                      <div className="cb-clients-card-main">
                        <div
                          className="cb-clients-card-check"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(c._id)}
                            aria-label={`Seleccionar ${c.name}`}
                          />
                        </div>

                        <button
                          type="button"
                          className="cb-clients-card-open"
                          onClick={() => openHub(c._id)}
                        >
                          <CompanyAvatar client={c} />
                          <div className="min-w-0 flex-1 text-left">
                            <h2 className="truncate text-base font-semibold tracking-tight">
                              {c.fullName || c.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              NIF {formatNifDisplay(c.taxId)}
                              {regime !== '—' ? ` · ${regime}` : ''}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className={cn('cb-pill', companyTypePillClass(tipo))}>{tipo}</span>
                              <span className={cn(estado.className)}>{estado.label}</span>
                              <span className={cn(portal.className)}>{portal.label}</span>
                              <span className="cb-clients-ob-dot">
                                <span className={dot.className} />
                                {obCount} pend.
                              </span>
                              {(c.tags || []).slice(0, 3).map((t) => (
                                <FirmTagBadge key={t.id} tag={t} />
                              ))}
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              Última actividade: {lastActivityLabel(c)}
                            </p>
                          </div>
                        </button>

                        <div className="cb-clients-card-menu">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => openHub(c._id)}>
                                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                Abrir hub
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
                                Remover da carteira
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div
                        className="cb-clients-card-actions"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <ClientPortalAccessAction client={c} onChanged={() => void refreshClients()} />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => openHub(c._id)}
                        >
                          Abrir hub
                        </Button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="cb-clients-table-wrap cb-table-scroll">
            <table className="cb-clients-table">
              <thead className="cb-clients-thead">
                <tr>
                  <th className="w-10">
                    <Checkbox
                      checked={pageItems.length > 0 && pageItems.every((c) => selected.has(c._id))}
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
                  <th className="w-36">Acesso portal</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState
                        icon={Building2}
                        title={emptyTitle}
                        description={emptyDescription}
                        action={
                          total === 0 ? (
                            <Button size="sm" variant="primary" onClick={() => setOpenCreate(true)}>
                              <Plus className="h-4 w-4" />
                              Novo cliente
                            </Button>
                          ) : undefined
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  pageItems.map((c) => {
                    const tipo = resolveCompanyType(c)
                    const obCount = c.pendingObligationsCount ?? 0
                    const dot = pendingObligationDot(obCount)
                    const estado = estadoPill(c)
                    const portal = resolvePortalInviteUi(c)
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
                          <div className="flex flex-col items-start gap-1.5">
                            <span className={cn(portal.className)}>{portal.label}</span>
                            <ClientPortalAccessAction
                              client={c}
                              onChanged={() => void refreshClients()}
                            />
                          </div>
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
                                Abrir hub
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
                                Remover da carteira
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
      </ClientsWorkspaceShell>

      <CreateCompanyWizard
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreated={() => void refreshClients()}
      />
      <ClientsSpreadsheetDialog
        open={spreadsheetOpen}
        onOpenChange={setSpreadsheetOpen}
        onImported={() => void refreshClients()}
      />
      <FirmClientBulkInviteDialog
        open={bulkInviteOpen}
        onOpenChange={setBulkInviteOpen}
        clientIds={[...selected]}
        clients={[...selected].map((id) => ({
          id,
          name:
            selectedMeta[id]?.name ||
            items.find((c) => c._id === id)?.fullName ||
            items.find((c) => c._id === id)?.name ||
            id,
          email: selectedMeta[id]?.email ?? items.find((c) => c._id === id)?.email ?? null,
        }))}
        onDone={() => {
          clearSelection()
          void refreshClients()
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
        variant="destructive"
        onConfirm={async () => {
          if (!archiveTarget) return
          await contabilClientsApi.archive(archiveTarget._id)
          toast.success('Cliente removido da carteira')
          setArchiveTarget(null)
          await refreshClients()
        }}
      />
    </>
  )
}

function ClientPortalAccessAction({
  client,
  onChanged,
}: {
  client: Client
  onChanged?: () => void
}) {
  const portal = resolvePortalInviteUi(client)
  if (portal.primaryAction === 'send_invite' || portal.primaryAction === 'resend_invite') {
    if (client.portalAccessStatus === 'ACTIVE' || client.portalAccessStatus === 'REVOKED') {
      return (
        <FirmClientAccessManager
          clientId={client._id}
          email={client.email}
          portalAccessStatus={client.portalAccessStatus}
          onChanged={onChanged}
          size="sm"
        />
      )
    }
    return (
      <FirmClientInviteButton
        clientId={client._id}
        email={client.email}
        size="sm"
        onDone={onChanged}
        label={portal.primaryAction === 'resend_invite' ? 'Reenviar convite' : 'Enviar convite'}
      />
    )
  }
  if (portal.primaryAction === 'manage_access') {
    return (
      <FirmClientAccessManager
        clientId={client._id}
        email={client.email}
        portalAccessStatus={client.portalAccessStatus || 'ACTIVE'}
        onChanged={onChanged}
        size="sm"
      />
    )
  }
  return null
}
