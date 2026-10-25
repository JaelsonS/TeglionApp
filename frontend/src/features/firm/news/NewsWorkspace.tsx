import { useCallback, useEffect, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Newspaper, Plus, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { NewsComposer, type NewsDraft } from '@/features/firm/news/NewsComposer'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { AskMayaButton } from '@/features/maya'
import { FirmWorkspaceFocusDialog } from '@/features/firm/FirmWorkspaceFocusDialog'
import { SkeletonCard } from '@/shared/design-system/Skeleton'
import { EmptyState, PageHeader } from '@/shared/design-system'
import { contabilNewsApi } from '@/infrastructure/api'
import type { NewsArticle } from '@/shared/types/contabil'
import { formatPtDate } from '@/shared/utils/contabilLocale'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

export function NewsWorkspace() {
  const [items, setItems] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editing, setEditing] = useState<NewsDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<NewsArticle | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = (await contabilNewsApi.list(statusFilter ? { status: statusFilter } : undefined)) as {
        items?: NewsArticle[]
      } | NewsArticle[]
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

  const filtered = search.trim()
    ? items.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          (a.excerpt || '').toLowerCase().includes(search.toLowerCase()),
      )
    : items

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

  async function confirmDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id || deleteTarget._id
    if (!id) return
    try {
      await contabilNewsApi.remove(id)
      toast.success('Notícia eliminada')
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

  return (
    <>
      <header className="cb-news-page-hd shrink-0 px-4 pt-4 sm:px-5" data-testid="firm-news-header">
        <PageHeader
          title="Notícias"
          subtitle="Conteúdo editorial para portal e página pública — artigos com capa e destaque. Avisos urgentes → Central de alertas."
          testId="firm-news-title"
          secondary={<AskMayaButton intentId="news" />}
          right={
            <Button type="button" className="shrink-0 rounded-full" onClick={startCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nova notícia
            </Button>
          }
        />
      </header>

      <div className="cb-news-workspace flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="cb-news-identity shrink-0">
          <span className="cb-news-identity-badge">Editorial</span>
          <p className="cb-news-identity-copy">
            Use para actualizações fiscais ou do gabinete com leitura calma. Para prazos imediatos,{' '}
            <Link to="/app/firm/alerts" className="font-medium text-brand hover:underline">
              publique um alerta
            </Link>
            .
          </p>
        </div>

        <div className="cb-news-toolbar shrink-0">
          <div className="cb-docs-search min-w-0 flex-1">
            <Search className="cb-docs-search-icon" aria-hidden />
            <Input
              className="cb-docs-search-input"
              placeholder="Pesquisar notícias…"
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
            <option value="ARCHIVED">Arquivadas</option>
          </select>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pt-3">
          {loading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Newspaper}
              title={items.length === 0 ? 'Ainda sem notícias' : 'Nenhuma notícia neste filtro'}
              description={
                items.length === 0
                  ? 'Publique actualizações fiscais ou do gabinete na página pública e no portal dos clientes.'
                  : 'Altere o filtro de estado ou limpe a pesquisa.'
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
            <ul className="space-y-2">
              {filtered.map((a) => {
                const id = a.id || a._id || a.slug
                return (
                  <li key={id}>
                    <div
                      className={cn(
                        'cb-news-list-item flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-brand/25',
                      )}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => setEditing({ ...a })}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-caption font-semibold uppercase',
                              a.status === 'PUBLISHED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {a.status === 'PUBLISHED'
                              ? 'Publicada'
                              : a.status === 'DRAFT'
                                ? 'Rascunho'
                                : a.status}
                          </span>
                          {a.isFeatured ? (
                            <span className="text-caption font-medium text-brand">Destaque</span>
                          ) : null}
                        </div>
                        <p className="mt-1 font-semibold text-foreground">{a.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {a.publishedAt ? formatPtDate(a.publishedAt) : 'Sem data de publicação'}
                          {a.readingTimeMinutes ? ` · ${a.readingTimeMinutes} min` : ''}
                        </p>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 rounded-lg text-destructive"
                        aria-label="Eliminar notícia"
                        onClick={() => setDeleteTarget(a)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

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
