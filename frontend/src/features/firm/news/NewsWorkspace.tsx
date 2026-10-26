import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FileEdit,
  Globe,
  Megaphone,
  Newspaper,
  Plus,
  Search,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'

import { NewsComposer, type NewsDraft } from '@/features/firm/news/NewsComposer'
import { NewsPreviewPanel } from '@/features/firm/news/NewsPreviewPanel'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { AskMayaButton } from '@/features/maya'
import { FirmWorkspaceFocusDialog } from '@/features/firm/FirmWorkspaceFocusDialog'
import { EmptyState, FirmSplitView } from '@/shared/design-system'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { contabilNewsApi } from '@/infrastructure/api'
import type { NewsArticle } from '@/shared/types/contabil'
import { useAuth } from '@/shared/hooks/useAuth'
import { formatPtDate } from '@/shared/utils/contabilLocale'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

export function NewsWorkspace() {
  const { user } = useAuth()
  const firmSlug = user?.tenant?.slug
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('news') || ''

  const [items, setItems] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [editing, setEditing] = useState<NewsDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<NewsArticle | null>(null)

  const publicUrl =
    typeof window !== 'undefined' && firmSlug
      ? `${window.location.origin}/${encodeURIComponent(firmSlug)}`
      : firmSlug
        ? `/${firmSlug}`
        : null

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = (await contabilNewsApi.list(
        statusFilter ? { status: statusFilter } : undefined,
      )) as { items?: NewsArticle[] } | NewsArticle[]
      const list = Array.isArray(res) ? res : res.items || []
      setItems(list)
    } catch (err) {
      toast.error('Não foi possível carregar as notícias', { description: getErrorMessage(err) })
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filtered = useMemo(() => {
    let list = items
    if (featuredOnly) list = list.filter((a) => a.isFeatured)
    const term = search.trim().toLowerCase()
    if (!term) return list
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        (a.excerpt || '').toLowerCase().includes(term) ||
        (a.category || '').toLowerCase().includes(term),
    )
  }, [items, search, featuredOnly])

  const selected =
    filtered.find((a) => (a.id || a._id) === selectedId) ||
    items.find((a) => (a.id || a._id) === selectedId) ||
    null

  const publishedCount = items.filter((a) => a.status === 'PUBLISHED').length
  const draftCount = items.filter((a) => a.status === 'DRAFT').length
  const featuredCount = items.filter((a) => a.isFeatured).length
  const archivedCount = items.filter((a) => a.status === 'ARCHIVED').length

  function selectNews(id: string) {
    const next = new URLSearchParams(searchParams)
    next.set('news', id)
    setSearchParams(next, { replace: true })
  }

  function clearNews() {
    const next = new URLSearchParams(searchParams)
    next.delete('news')
    setSearchParams(next, { replace: true })
  }

  function applyStatus(next: string) {
    setStatusFilter((prev) => (prev === next ? '' : next))
  }

  async function save(publish: boolean) {
    if (!editing?.title?.trim() || !editing?.body?.trim()) {
      toast.error('Preencha título e conteúdo')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: editing.title.trim(),
        excerpt: editing.excerpt || null,
        body: editing.body,
        category: editing.category || null,
        coverStorageKey: editing.coverStorageKey || undefined,
        isFeatured: Boolean(editing.isFeatured),
        status: publish ? 'PUBLISHED' : 'DRAFT',
      }
      const id = editing.id || editing._id
      if (id) {
        await contabilNewsApi.update(id, payload)
      } else {
        await contabilNewsApi.create(payload)
      }
      toast.success(publish ? 'Notícia publicada' : 'Rascunho guardado')
      setEditing(null)
      await refresh()
    } catch (err) {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  async function publishSelected() {
    if (!selected) return
    const id = selected.id || selected._id
    if (!id) return
    try {
      await contabilNewsApi.update(id, { status: 'PUBLISHED' })
      toast.success('Notícia publicada')
      await refresh()
    } catch (err) {
      toast.error('Não foi possível publicar', { description: getErrorMessage(err) })
    }
  }

  async function archiveSelected() {
    if (!selected) return
    const id = selected.id || selected._id
    if (!id) return
    try {
      await contabilNewsApi.update(id, { status: 'ARCHIVED' })
      toast.success('Notícia arquivada')
      await refresh()
    } catch (err) {
      toast.error('Não foi possível arquivar', { description: getErrorMessage(err) })
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id || deleteTarget._id
    if (!id) return
    try {
      await contabilNewsApi.remove(id)
      toast.success('Notícia eliminada')
      if (selectedId === id) clearNews()
      setDeleteTarget(null)
      await refresh()
    } catch (err) {
      toast.error('Não foi possível eliminar', { description: getErrorMessage(err) })
    }
  }

  const startCreate = () =>
    setEditing({
      title: '',
      body: '',
      excerpt: '',
      status: 'DRAFT',
      isFeatured: false,
    })

  const kpis = [
    {
      id: 'published',
      label: 'Publicadas',
      value: publishedCount,
      tone: 'emerald' as const,
      icon: Globe,
      active: statusFilter === 'PUBLISHED',
      onClick: () => applyStatus('PUBLISHED'),
    },
    {
      id: 'drafts',
      label: 'Rascunhos',
      value: draftCount,
      tone: 'amber' as const,
      icon: FileEdit,
      active: statusFilter === 'DRAFT',
      onClick: () => applyStatus('DRAFT'),
    },
    {
      id: 'featured',
      label: 'Em destaque',
      value: featuredCount,
      tone: 'brand' as const,
      icon: Star,
      active: featuredOnly,
      onClick: () => setFeaturedOnly((v) => !v),
    },
    {
      id: 'archived',
      label: 'Arquivadas',
      value: archivedCount,
      tone: 'muted' as const,
      icon: Newspaper,
      active: statusFilter === 'ARCHIVED',
      onClick: () => applyStatus('ARCHIVED'),
    },
  ]

  const toolbar = (
    <div className="cb-news-toolbar-stack">
      <div className="cb-news-kpi-strip" data-testid="firm-news-kpis">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <button
              key={kpi.id}
              type="button"
              className={cn(
                'cb-news-kpi',
                `cb-news-kpi--${kpi.tone}`,
                kpi.active && 'cb-news-kpi--active',
              )}
              onClick={kpi.onClick}
              aria-pressed={kpi.active}
            >
              <span className="cb-news-kpi-icon" aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 text-left">
                <span className="cb-news-kpi-value">{kpi.value}</span>
                <span className="cb-news-kpi-label">{kpi.label}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="cb-news-purpose" data-testid="firm-news-purpose">
        <div className="min-w-0 flex-1">
          <p className="cb-news-purpose-title">Editorial do gabinete</p>
          <p className="cb-news-purpose-detail">
            Artigos com capa e destaque para portal e página pública. Para prazos ou urgências,{' '}
            <Link to="/app/firm/alerts" className="font-medium text-brand hover:underline">
              publique um alerta
            </Link>
            .
          </p>
        </div>
        <Newspaper className="cb-news-purpose-icon h-5 w-5 shrink-0" aria-hidden />
      </div>

      <div className="cb-docs-toolbar !mb-0">
        <div className="cb-docs-search min-w-0 flex-1">
          <Search className="cb-docs-search-icon" aria-hidden />
          <Input
            className="cb-docs-search-input"
            placeholder="Pesquisar título, excerto ou categoria…"
            value={search}
            onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="cb-docs-filter"
          value={statusFilter}
          onChange={(e: FormChangeEvent) => setStatusFilter(e.target.value)}
          aria-label="Filtrar estado"
        >
          <option value="">Estado: Todos</option>
          <option value="PUBLISHED">Publicadas</option>
          <option value="DRAFT">Rascunhos</option>
          <option value="SCHEDULED">Agendadas</option>
          <option value="ARCHIVED">Arquivadas</option>
        </select>
      </div>
    </div>
  )

  const list = (
    <div className="cb-news-list-wrap">
      {loading ? (
        <div className="space-y-2 p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[4.75rem] animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          className="m-3"
          icon={Newspaper}
          title={items.length === 0 ? 'Ainda sem notícias' : 'Nenhuma notícia neste filtro'}
          description={
            items.length === 0
              ? 'Publique actualizações fiscais ou do gabinete na página pública e no portal dos clientes.'
              : 'Altere o filtro de estado, destaque ou limpe a pesquisa.'
          }
          action={
            items.length === 0 ? (
              <Button type="button" size="sm" variant="primary" onClick={startCreate}>
                <Plus className="h-4 w-4" />
                Publicar primeira notícia
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-1.5 p-2">
          {filtered.map((a) => {
            const id = a.id || a._id || a.slug
            const active = (a.id || a._id) === selectedId
            return (
              <li key={id}>
                <button
                  type="button"
                  className={cn('cb-news-list-item', active && 'cb-news-list-item--active')}
                  onClick={() => selectNews(String(a.id || a._id))}
                  data-testid={`firm-news-row-${id}`}
                >
                  {a.coverUrl ? (
                    <span className="cb-news-list-thumb" aria-hidden>
                      <img src={a.coverUrl} alt="" />
                    </span>
                  ) : (
                    <span className="cb-news-list-thumb cb-news-list-thumb--empty" aria-hidden>
                      <Newspaper className="h-4 w-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 text-left">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          'cb-news-status-pill',
                          a.status === 'PUBLISHED' && 'cb-news-status-pill--live',
                          a.status === 'DRAFT' && 'cb-news-status-pill--draft',
                          a.status === 'ARCHIVED' && 'cb-news-status-pill--archived',
                        )}
                      >
                        {a.status === 'PUBLISHED'
                          ? 'Publicada'
                          : a.status === 'DRAFT'
                            ? 'Rascunho'
                            : a.status === 'ARCHIVED'
                              ? 'Arquivada'
                              : a.status}
                      </span>
                      {a.isFeatured ? (
                        <span className="cb-news-featured-pill">
                          <Star className="h-3 w-3" aria-hidden />
                          Destaque
                        </span>
                      ) : null}
                      {a.category ? <span className="cb-news-cat-pill">{a.category}</span> : null}
                    </span>
                    <span className="cb-news-list-title">{a.title}</span>
                    <span className="cb-news-list-meta">
                      {a.publishedAt ? formatPtDate(a.publishedAt) : 'Sem data de publicação'}
                      {a.readingTimeMinutes ? ` · ${a.readingTimeMinutes} min` : ''}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  const detail = (
    <NewsPreviewPanel
      item={selected}
      embedded
      onEdit={() => selected && setEditing({ ...selected })}
      onDelete={() => selected && setDeleteTarget(selected)}
      onPublish={selected?.status === 'DRAFT' ? () => void publishSelected() : undefined}
      onArchive={selected?.status === 'PUBLISHED' ? () => void archiveSelected() : undefined}
    />
  )

  return (
    <>
      <FirmModuleShell
        className="cb-news-shell"
        title="Notícias"
        subtitle="Conteúdo editorial para portal e página pública — artigos com capa, categoria e destaque."
        headerRight={
          <div className="flex flex-wrap items-center gap-2">
            <AskMayaButton intentId="news" />
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to="/app/firm/alerts">
                <Megaphone className="mr-1.5 h-4 w-4" aria-hidden />
                Alertas
              </Link>
            </Button>
            {publicUrl ? (
              <Button type="button" size="sm" variant="outline" asChild>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <Globe className="mr-1.5 h-4 w-4" aria-hidden />
                  Página pública
                </a>
              </Button>
            ) : null}
            <Button type="button" className="cb-alerts-btn-primary shrink-0" onClick={startCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nova notícia
            </Button>
          </div>
        }
        bodyClassName="cb-news-body"
      >
        <FirmSplitView
          hasSelection={Boolean(selectedId)}
          onClearSelection={clearNews}
          sheetTitle={selected?.title || 'Notícia'}
          toolbar={toolbar}
          list={list}
          detail={detail}
        />
      </FirmModuleShell>

      <FirmWorkspaceFocusDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing?.id || editing?._id ? 'Editar notícia' : 'Nova notícia'}
        description="Escreva, grave rascunho ou publique — no centro do ecrã."
        className="w-[min(96vw,720px)] max-w-[min(96vw,720px)]"
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {editing ? (
            <NewsComposer
              draft={editing}
              onChange={setEditing}
              saving={saving}
              onSaveDraft={() => void save(false)}
              onPublish={() => void save(true)}
            />
          ) : null}
        </div>
      </FirmWorkspaceFocusDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
        title="Eliminar notícia?"
        description="Esta acção não pode ser anulada. O artigo deixa de aparecer no portal do cliente."
        confirmLabel="Eliminar"
        variant="destructive"
        testId="firm-news-delete"
        onConfirm={async () => {
          await confirmDelete()
        }}
      />
    </>
  )
}
