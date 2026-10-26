import { Archive, Eye, Pencil, Send, Star, Trash2 } from 'lucide-react'

import { NewsBodyContent } from '@/features/firm/news/newsBody'
import { Button } from '@/shared/components/ui/button'
import { EmptyState } from '@/shared/design-system'
import type { NewsArticle } from '@/shared/types/contabil'
import { formatPtDate } from '@/shared/utils/contabilLocale'
import { cn } from '@/shared/lib/utils'

const STATUS_PT: Record<NewsArticle['status'], string> = {
  DRAFT: 'Rascunho',
  SCHEDULED: 'Agendada',
  PUBLISHED: 'Publicada',
  ARCHIVED: 'Arquivada',
}

type Props = {
  item: NewsArticle | null
  onEdit: () => void
  onDelete: () => void
  onPublish?: () => void
  onArchive?: () => void
  embedded?: boolean
}

export function NewsPreviewPanel({
  item,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
  embedded,
}: Props) {
  if (!item) {
    return (
      <div
        className={cn(
          'flex h-full min-h-0 flex-col items-center justify-center p-6',
          !embedded && 'min-h-[280px] rounded-xl border border-dashed border-border/60 bg-muted/10',
        )}
      >
        <EmptyState
          title="Seleccione uma notícia"
          description="Escolha um artigo na lista para pré-visualizar capa, texto e metadados editoriais."
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden bg-card',
        !embedded && 'rounded-xl border border-border/50 shadow-sm',
        embedded && 'border-0 shadow-none',
      )}
    >
      {item.coverUrl ? (
        <div className="cb-news-preview-cover shrink-0">
          <img src={item.coverUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="border-b border-border/40 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'cb-news-status-pill',
              item.status === 'PUBLISHED' && 'cb-news-status-pill--live',
              item.status === 'DRAFT' && 'cb-news-status-pill--draft',
              item.status === 'ARCHIVED' && 'cb-news-status-pill--archived',
            )}
          >
            {STATUS_PT[item.status] || item.status}
          </span>
          {item.isFeatured ? (
            <span className="cb-news-featured-pill">
              <Star className="h-3 w-3" aria-hidden />
              Destaque
            </span>
          ) : null}
          {item.category ? <span className="cb-news-cat-pill">{item.category}</span> : null}
        </div>
        <h2 className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">
          {item.title}
        </h2>
        {item.excerpt ? <p className="mt-1 text-sm text-muted-foreground">{item.excerpt}</p> : null}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <NewsBodyContent
          body={item.body}
          className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground/90"
        />

        <dl className="mt-6 grid gap-3 rounded-xl bg-muted/30 p-4 text-sm">
          <div>
            <dt className="text-caption font-medium uppercase text-muted-foreground">Publicação</dt>
            <dd className="mt-0.5 font-medium">
              {item.publishedAt ? formatPtDate(item.publishedAt) : 'Ainda sem data'}
              {item.readingTimeMinutes ? ` · ${item.readingTimeMinutes} min de leitura` : ''}
            </dd>
          </div>
          {item.authorName ? (
            <div>
              <dt className="text-caption font-medium uppercase text-muted-foreground">Autor</dt>
              <dd className="mt-0.5">{item.authorName}</dd>
            </div>
          ) : null}
          {item.slug ? (
            <div>
              <dt className="text-caption font-medium uppercase text-muted-foreground">Slug</dt>
              <dd className="mt-0.5 font-mono text-xs text-muted-foreground">{item.slug}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border/40 p-3">
        <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={onEdit}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Editar
        </Button>
        {item.status === 'DRAFT' && onPublish ? (
          <Button size="sm" className="h-8 rounded-lg" onClick={onPublish}>
            <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Publicar
          </Button>
        ) : null}
        {item.status === 'PUBLISHED' && onArchive ? (
          <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={onArchive}>
            <Archive className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Arquivar
          </Button>
        ) : null}
        {item.status === 'PUBLISHED' ? (
          <span className="inline-flex items-center gap-1 self-center text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5" aria-hidden />
            Visível no portal / site
          </span>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-8 rounded-lg text-red-600"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
