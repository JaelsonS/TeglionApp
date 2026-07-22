import { useCallback, useEffect, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Newspaper, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { NewsComposer, type NewsDraft } from '@/features/firm/news/NewsComposer'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { SkeletonCard } from '@/shared/design-system/Skeleton'
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Notícias do portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Artigos longos que os clientes lêem em «Notícias» no portal.
          </p>
        </div>
        <Button
          type="button"
          className="rounded-full"
          onClick={() =>
            setEditing({
              title: '',
              body: '',
              excerpt: '',
              status: 'DRAFT',
              isFeatured: false,
            })
          }
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nova notícia
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="rounded-full pl-9"
            placeholder="Pesquisar…"
            value={search}
            onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="cb-field-control rounded-full px-3 text-sm"
          value={statusFilter}
          onChange={(e: FormChangeEvent) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os estados</option>
          <option value="PUBLISHED">Publicadas</option>
          <option value="DRAFT">Rascunhos</option>
          <option value="ARCHIVED">Arquivadas</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <div className="cb-empty-state">
          <Newspaper className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">Ainda não há notícias. Publique a primeira.</p>
        </div>
      ) : (
        <ul className="space-y-2 overflow-y-auto">
          {filtered.map((a) => {
            const id = a.id || a._id || a.slug
            return (
              <li key={id}>
                <div
                  className={cn(
                    'flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-brand/25',
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
                        {a.status === 'PUBLISHED' ? 'Publicada' : a.status === 'DRAFT' ? 'Rascunho' : a.status}
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

      <Sheet open={Boolean(editing)} onOpenChange={(open: boolean) => !open && setEditing(null)}>
        <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editing?.id || editing?._id ? 'Editar notícia' : 'Nova notícia'}</SheetTitle>
          </SheetHeader>
          {editing ? (
            <NewsComposer
              draft={editing}
              onChange={setEditing}
              saving={saving}
              onSaveDraft={() => void save(false)}
              onPublish={() => void save(true)}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
        title="Eliminar notícia?"
        description="Esta acção não pode ser anulada. O artigo deixa de aparecer no portal do cliente."
        confirmLabel="Eliminar"
        testId="firm-news-delete"
        onConfirm={async () => {
          await confirmDelete()
        }}
      />
    </div>
  )
}
