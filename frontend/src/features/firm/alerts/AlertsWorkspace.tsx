import { useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  FileEdit,
  Loader2,
  Megaphone,
  Newspaper,
  Pin,
  Plus,
  Search,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'

import { AlertAnalyticsPanel, AlertPreviewPanel } from '@/features/firm/alerts/AlertPreviewPanel'
import { AlertComposer, type AlertDraft } from '@/features/firm/alerts/AlertComposer'
import { PriorityBadge } from '@/features/firm/alerts/broadcast-ui'
import { categoryLabel, PRIORITY_FILTER_OPTIONS, STATUS_LABELS } from '@/features/firm/alerts/alertLabels'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { AskMayaButton } from '@/features/maya'
import { EmptyState, FirmSplitView } from '@/shared/design-system'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import type { FirmBroadcast } from '@/infrastructure/api/contabil/broadcasts'
import { useBroadcastMutations, useBroadcastsMeta, useFirmBroadcasts } from '@/shared/hooks/queries/useBroadcasts'
import { fetchBroadcastAnalytics } from '@/infrastructure/api/contabil/broadcasts'
import { useFirmClientsDirectory } from '@/shared/hooks/queries/useFirmClientsDirectory'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { formatDateTime } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

export function AlertsWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('alert') || ''
  const priorityFilter = searchParams.get('priority') || ''

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState<AlertDraft | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FirmBroadcast | null>(null)
  const clientsQuery = useFirmClientsDirectory({ limit: 500 })
  const clients = clientsQuery.data?.items || []
  const [analyticsId, setAnalyticsId] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  const { data: meta } = useBroadcastsMeta()
  const overviewQuery = useFirmBroadcasts({})
  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: category || undefined,
      priority: priorityFilter || undefined,
      status: status || undefined,
    }),
    [debouncedSearch, category, priorityFilter, status],
  )
  const { data, isLoading } = useFirmBroadcasts(filters)
  const { create, update, remove } = useBroadcastMutations()

  const items = data?.items || []
  const overview = overviewQuery.data?.items || []
  const selected = items.find((i) => i.id === selectedId) || overview.find((i) => i.id === selectedId) || null

  const publishedCount = overview.filter((i) => i.status === 'PUBLISHED').length
  const urgentCount = overview.filter((i) => i.priority === 'URGENT' && i.status !== 'ARCHIVED').length
  const draftCount = overview.filter((i) => i.status === 'DRAFT').length
  const scheduledCount = overview.filter((i) => i.status === 'SCHEDULED').length

  function selectAlert(id: string) {
    const next = new URLSearchParams(searchParams)
    next.set('alert', id)
    setSearchParams(next, { replace: true })
  }

  function clearAlert() {
    const next = new URLSearchParams(searchParams)
    next.delete('alert')
    setSearchParams(next, { replace: true })
  }

  function setPriorityFilter(p: string) {
    const next = new URLSearchParams(searchParams)
    if (p) next.set('priority', p)
    else next.delete('priority')
    setSearchParams(next, { replace: true })
  }

  function applyStatusFilter(nextStatus: string) {
    setStatus((prev) => (prev === nextStatus ? '' : nextStatus))
  }

  async function openAnalytics(id: string) {
    setAnalyticsId(id)
    setLoadingAnalytics(true)
    try {
      const res = await fetchBroadcastAnalytics(id)
      setAnalytics(res as Record<string, unknown>)
    } catch (err) {
      toast.error('Não foi possível carregar estatísticas', { description: getErrorMessage(err) })
    } finally {
      setLoadingAnalytics(false)
    }
  }

  function startCreate() {
    setEditing({
      title: '',
      body: '',
      excerpt: '',
      category: 'AVISO',
      priority: 'MEDIUM',
      status: 'DRAFT',
      targetType: 'ALL_CLIENTS',
      targetClientIds: [],
      attachments: [],
      pinned: false,
      readConfirmationRequired: false,
    })
  }

  function startEdit(item: FirmBroadcast) {
    setEditing({
      ...item,
      body: item.body,
      attachments: item.attachments || [],
      coverUrl: item.coverUrl,
    })
  }

  async function save(publish = false) {
    if (!editing?.title?.trim() || !editing?.body?.trim()) {
      toast.error('Preencha título e conteúdo')
      return
    }
    const payload = {
      ...editing,
      status: publish ? 'PUBLISHED' : editing.status || 'DRAFT',
    }
    try {
      if (editing.id || editing._id) {
        await update.mutateAsync({ id: editing.id || editing._id!, payload })
        toast.success(publish ? 'Comunicado publicado' : 'Rascunho guardado')
      } else {
        await create.mutateAsync(payload)
        toast.success(publish ? 'Comunicado publicado' : 'Rascunho criado')
      }
      setEditing(null)
    } catch (err) {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    }
  }

  const saving = create.isPending || update.isPending

  const kpis = [
    {
      id: 'published',
      label: 'Publicados',
      value: publishedCount,
      tone: 'emerald' as const,
      icon: Send,
      active: status === 'PUBLISHED',
      onClick: () => applyStatusFilter('PUBLISHED'),
    },
    {
      id: 'urgent',
      label: 'Urgentes',
      value: urgentCount,
      tone: urgentCount > 0 ? ('rose' as const) : ('muted' as const),
      icon: AlertTriangle,
      active: priorityFilter === 'URGENT',
      onClick: () => setPriorityFilter(priorityFilter === 'URGENT' ? '' : 'URGENT'),
    },
    {
      id: 'drafts',
      label: 'Rascunhos',
      value: draftCount,
      tone: 'amber' as const,
      icon: FileEdit,
      active: status === 'DRAFT',
      onClick: () => applyStatusFilter('DRAFT'),
    },
    {
      id: 'scheduled',
      label: 'Agendados',
      value: scheduledCount,
      tone: 'brand' as const,
      icon: CheckCircle2,
      active: status === 'SCHEDULED',
      onClick: () => applyStatusFilter('SCHEDULED'),
    },
  ]

  const toolbar = (
    <div className="cb-alerts-toolbar">
      <div className="cb-alerts-kpi-strip" data-testid="firm-alerts-kpis">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <button
              key={kpi.id}
              type="button"
              className={cn(
                'cb-alerts-kpi',
                `cb-alerts-kpi--${kpi.tone}`,
                kpi.active && 'cb-alerts-kpi--active',
              )}
              onClick={kpi.onClick}
              aria-pressed={kpi.active}
            >
              <span className="cb-alerts-kpi-icon" aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 text-left">
                <span className="cb-alerts-kpi-value">{kpi.value}</span>
                <span className="cb-alerts-kpi-label">{kpi.label}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="cb-alerts-purpose" data-testid="firm-alerts-purpose">
        <div className="min-w-0 flex-1">
          <p className="cb-alerts-purpose-title">Isto é um alerta — não um artigo</p>
          <p className="cb-alerts-purpose-detail">
            Use para avisos urgentes: prazo a vencer, documento em falta, alteração crítica. Curtos, com
            prioridade e confirmação de leitura. Para textos informativos (escritório fechado, lei que mudou,
            novidades do gabinete), publique no{' '}
            <Link to="/app/firm/news" className="font-medium text-brand hover:underline">
              blog de Notícias
            </Link>
            .
          </p>
        </div>
        <Megaphone className="cb-alerts-purpose-icon h-5 w-5 shrink-0" aria-hidden />
      </div>

      <div className="cb-docs-toolbar !mb-0">
        <div className="cb-docs-search min-w-0 flex-1">
          <Search className="cb-docs-search-icon" aria-hidden />
          <Input
            className="cb-docs-search-input"
            placeholder="Pesquisar por título ou excerto…"
            value={search}
            onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="cb-docs-filter"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Tipo"
        >
          <option value="">Tipo: Todos</option>
          {(meta?.categories || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className="cb-docs-filter"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Estado"
        >
          <option value="">Estado: Todos</option>
          <option value="DRAFT">Rascunho</option>
          <option value="SCHEDULED">Agendado</option>
          <option value="PUBLISHED">Publicado</option>
          <option value="ARCHIVED">Arquivado</option>
        </select>
      </div>

      <div className="cb-alerts-priority-chips" role="group" aria-label="Prioridade">
        <button
          type="button"
          className={cn('cb-alerts-chip', !priorityFilter && 'cb-alerts-chip-active')}
          onClick={() => setPriorityFilter('')}
        >
          Todas
        </button>
        {PRIORITY_FILTER_OPTIONS.filter((o) => o.id).map((o) => (
          <button
            key={o.id}
            type="button"
            className={cn('cb-alerts-chip', priorityFilter === o.id && 'cb-alerts-chip-active')}
            onClick={() => setPriorityFilter(o.id)}
          >
            {o.label}
            {o.id === 'URGENT' && urgentCount > 0 ? (
              <span className="cb-alerts-chip-count">{urgentCount}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  )

  const list = (
    <div className="cb-alerts-list-wrap">
      {isLoading ? (
        <div className="space-y-2 p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[4.5rem] animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          className="m-3"
          icon={Megaphone}
          title={overview.length === 0 ? 'Ainda sem alertas' : 'Nenhum resultado'}
          description={
            overview.length === 0
              ? 'Crie alertas para prazos, documentos em falta ou avisos urgentes. Os clientes vêem-nos no portal — com prioridade e, se quiser, confirmação de leitura.'
              : 'Ajuste pesquisa, tipo, estado ou prioridade.'
          }
          action={
            overview.length === 0 ? (
              <Button type="button" size="sm" variant="primary" onClick={startCreate}>
                <Plus className="h-4 w-4" />
                Criar primeiro alerta
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-1.5 p-2">
          {items.map((item) => {
            const active = item.id === selectedId
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => selectAlert(item.id)}
                  className={cn(
                    'cb-alerts-list-item',
                    active && 'cb-alerts-list-item-active',
                    item.priority === 'URGENT' && !active && 'cb-alerts-list-item-urgent',
                  )}
                  data-testid={`firm-alert-row-${item.id}`}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.pinned ? <Pin className="h-3 w-3 shrink-0 text-brand" aria-label="Fixado" /> : null}
                    <PriorityBadge priority={item.priority} />
                    <span className="cb-alerts-list-cat">{categoryLabel(item.category)}</span>
                    <span className="cb-alerts-list-status">
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                    {item.readConfirmationRequired ? (
                      <span className="cb-alerts-list-ack">Confirmação</span>
                    ) : null}
                  </div>
                  <p className="cb-alerts-list-title">{item.title}</p>
                  {item.excerpt ? <p className="cb-alerts-list-excerpt">{item.excerpt}</p> : null}
                  <p className="cb-alerts-list-meta">
                    {item.publishedAt ? formatDateTime(item.publishedAt) : 'Por publicar'}
                    {item.status === 'PUBLISHED' && item.readCount != null
                      ? ` · ${item.readCount}/${item.deliveryCount ?? '—'} leituras`
                      : ''}
                    {item.targetType === 'SELECTED'
                      ? ` · ${item.targetClientIds?.length || 0} clientes`
                      : ' · Toda a carteira'}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  const detail = (
    <AlertPreviewPanel
      item={selected}
      embedded
      onEdit={() => selected && startEdit(selected)}
      onDelete={() => selected && setDeleteTarget(selected)}
      onAnalytics={() => selected && void openAnalytics(selected.id)}
      onPublish={
        selected?.status === 'DRAFT'
          ? () => {
              void update
                .mutateAsync({ id: selected.id, payload: { ...selected, status: 'PUBLISHED' } })
                .then(() => toast.success('Comunicado publicado'))
                .catch((err) =>
                  toast.error('Não foi possível publicar', { description: getErrorMessage(err) }),
                )
            }
          : undefined
      }
    />
  )

  return (
    <>
      <FirmModuleShell
        className="cb-alerts-shell cb-alerts-page-scroll"
        title="Central de alertas"
        subtitle="Avisos urgentes ao portal — prazos, faltas e confirmação de leitura. Não é o blog do escritório (isso fica em Notícias)."
        headerRight={
          <div className="flex flex-wrap items-center gap-2">
            <AskMayaButton intentId="alerts" />
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to="/app/firm/news">
                <Newspaper className="mr-1.5 h-4 w-4" aria-hidden />
                Blog / Notícias
              </Link>
            </Button>
            <Button type="button" className="cb-alerts-btn-primary shrink-0" onClick={startCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Novo alerta
            </Button>
          </div>
        }
        bodyClassName="cb-alerts-body"
      >
        <FirmSplitView
          hasSelection={Boolean(selectedId)}
          onClearSelection={clearAlert}
          sheetTitle={selected?.title || 'Comunicado'}
          toolbar={toolbar}
          list={list}
          detail={detail}
        />
      </FirmModuleShell>

      <Dialog open={Boolean(editing)} onOpenChange={(open: boolean) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing?.id || editing?._id ? 'Editar comunicado' : 'Novo comunicado'}
            </DialogTitle>
          </DialogHeader>
          {editing ? (
            <AlertComposer
              draft={editing}
              onChange={setEditing}
              clients={clients}
              categories={meta?.categories || []}
              onSaveDraft={() => void save(false)}
              onPublish={() => void save(true)}
              saving={saving}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(analyticsId)} onOpenChange={(open: boolean) => !open && setAnalyticsId(null)}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-display">Envolvimento</DialogTitle>
          </DialogHeader>
          {loadingAnalytics ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AlertAnalyticsPanel loading={loadingAnalytics} analytics={analytics} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        testId="alert-delete"
        title="Apagar este comunicado?"
        description={`«${deleteTarget?.title}» será removido permanentemente. Esta acção não pode ser desfeita.`}
        confirmLabel="Sim, apagar"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteTarget) return
          await remove.mutateAsync(deleteTarget.id)
          toast.success('Comunicado apagado')
          if (selectedId === deleteTarget.id) clearAlert()
          setDeleteTarget(null)
        }}
      />
    </>
  )
}
