import { useEffect, useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { useSearchParams } from 'react-router-dom'
import { Loader2, Megaphone, Pin, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

import { AlertAnalyticsPanel, AlertPreviewPanel } from '@/features/firm/alerts/AlertPreviewPanel'
import { AlertComposer, type AlertDraft } from '@/features/firm/alerts/AlertComposer'
import { PriorityBadge } from '@/features/firm/alerts/broadcast-ui'
import { categoryLabel, PRIORITY_FILTER_OPTIONS } from '@/features/firm/alerts/alertLabels'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { ModuleHelpDialog } from '@/shared/design-system/ModuleHelpDialog'
import { EmptyState, FirmSplitView } from '@/shared/design-system'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import type { FirmBroadcast } from '@/infrastructure/api/contabil/broadcasts'
import { useBroadcastMutations, useBroadcastsMeta, useFirmBroadcasts } from '@/shared/hooks/queries/useBroadcasts'
import { fetchBroadcastAnalytics } from '@/infrastructure/api/contabil/broadcasts'
import { contabilClientsApi } from '@/infrastructure/api'
import { formatDateTime } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'
import type { Client } from '@/shared/types/clients'
import { cn } from '@/shared/lib/utils'

export function AlertsWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('alert') || ''
  const priorityFilter = searchParams.get('priority') || ''

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState<AlertDraft | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FirmBroadcast | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [analyticsId, setAnalyticsId] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  const { data: meta } = useBroadcastsMeta()
  const filters = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      priority: priorityFilter || undefined,
      status: status || undefined,
    }),
    [search, category, priorityFilter, status],
  )
  const { data, isLoading } = useFirmBroadcasts(filters)
  const { create, update, remove } = useBroadcastMutations()

  useEffect(() => {
    void contabilClientsApi.list({ page: 1, limit: 300 }).then((r: { items?: Client[] }) => {
      setClients(r.items || [])
    })
  }, [])

  const items = data?.items || []
  const selected = items.find((i) => i.id === selectedId) || null
  const urgentCount = items.filter((i) => i.priority === 'URGENT').length
  const publishedCount = items.filter((i) => i.status === 'PUBLISHED').length
  const draftCount = items.filter((i) => i.status === 'DRAFT').length

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

  const toolbar = (
    <div className="cb-alerts-toolbar">
      <div className="cb-alerts-kpi-row">
        <div className="cb-alerts-kpi">
          <span className="cb-alerts-kpi-label">Publicados</span>
          <span className="cb-alerts-kpi-value">{publishedCount}</span>
        </div>
        <div className={cn('cb-alerts-kpi', urgentCount > 0 && 'cb-alerts-kpi-alert')}>
          <span className="cb-alerts-kpi-label">Urgentes</span>
          <span className="cb-alerts-kpi-value">{urgentCount}</span>
        </div>
        <div className="cb-alerts-kpi">
          <span className="cb-alerts-kpi-label">Rascunhos</span>
          <span className="cb-alerts-kpi-value">{draftCount}</span>
        </div>
      </div>

      <div className="cb-docs-toolbar !mb-0">
        <div className="cb-docs-search min-w-0 flex-1">
          <Search className="cb-docs-search-icon" aria-hidden />
          <Input
            className="cb-docs-search-input"
            placeholder="Pesquisar comunicados…"
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
        </select>
      </div>

      <div className="cb-alerts-priority-chips">
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
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          className="m-3"
          icon={Megaphone}
          title="Ainda sem comunicados"
          description="Use alertas para avisar a carteira de prazos, mudanças fiscais ou avisos urgentes. Os clientes vêem-nos no portal."
          action={
            <Button type="button" size="sm" variant="primary" onClick={startCreate}>
              <Plus className="h-4 w-4" />
              Criar primeiro comunicado
            </Button>
          }
        />
      ) : (
        <ul className="space-y-1 p-2">
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
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.pinned ? <Pin className="h-3 w-3 shrink-0 text-brand" /> : null}
                    <PriorityBadge priority={item.priority} />
                    <span className="cb-alerts-list-cat">{categoryLabel(item.category)}</span>
                  </div>
                  <p className="cb-alerts-list-title">{item.title}</p>
                  {item.excerpt ? (
                    <p className="cb-alerts-list-excerpt">{item.excerpt}</p>
                  ) : null}
                  <p className="cb-alerts-list-meta">
                    {item.publishedAt ? formatDateTime(item.publishedAt) : 'Rascunho'}
                    {item.readCount != null && item.status === 'PUBLISHED'
                      ? ` · ${item.readCount} leituras`
                      : ''}
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
      <header className="cb-alerts-page-hd shrink-0" data-testid="firm-alerts-header">
        <div className="cb-alerts-page-hd-row">
          <div>
            <h1 className="cb-alerts-page-title">Central de comunicação</h1>
            <p className="cb-alerts-page-sub">
              Comunicados fiscais para a carteira — profissional e rastreável
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ModuleHelpDialog
              title="Central de Alertas"
              intro="Use a Central de Alertas para avisar os seus clientes sobre informações importantes que o escritório tratou — prazos, novidades fiscais ou avisos operacionais, de forma profissional e rastreável."
              steps={[
                { title: 'Escreva o comunicado', description: 'Escolha um título e a mensagem que quer partilhar com os clientes.' },
                { title: 'Escolha os destinatários', description: 'Envie para toda a carteira ou seleccione apenas alguns clientes.' },
                { title: 'Publique e acompanhe', description: 'Depois de publicado, veja quem leu e quem confirmou em «Envolvimento».' },
              ]}
              cta={{ label: 'Criar novo comunicado', onClick: startCreate }}
            />
            <Button type="button" className="cb-alerts-btn-primary shrink-0" onClick={startCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo comunicado
            </Button>
          </div>
        </div>
      </header>

      <div className="cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <FirmSplitView
          hasSelection={Boolean(selectedId)}
          onClearSelection={clearAlert}
          sheetTitle={selected?.title || 'Comunicado'}
          toolbar={toolbar}
          list={list}
          detail={detail}
        />
      </div>

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
