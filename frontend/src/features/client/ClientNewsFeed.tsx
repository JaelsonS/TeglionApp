import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, FileText, Newspaper, Search } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useClientNewsFeed, clientNewsQueryKey } from '@/shared/hooks/useClientNews'
import { clientPortalContabilApi } from '@/infrastructure/api'
import { markNewsArticleRead, isNewsArticleRead, useClientNewsReadVersion } from '@/shared/utils/clientNewsRead'
import { emitAppDataChanged } from '@/shared/utils/appEvents'
import { formatPtDate } from '@/shared/utils/contabilLocale'
import { getErrorMessage } from '@/shared/utils/errors'
import type { NewsArticle } from '@/shared/types/contabil'
import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/components/ui/input'
import { SkeletonCard } from '@/shared/design-system/Skeleton'
import { Button } from '@/shared/components/ui/button'

type Props = {
  previewMode?: boolean
}

export function ClientNewsFeed({ previewMode }: Props) {
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const slugFromUrl = searchParams.get('slug')
  const [search, setSearch] = useState('')
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [loadingArticle, setLoadingArticle] = useState(false)

  const { items: allItems, isLoading, refetch } = useClientNewsFeed(!previewMode)
  const readVersion = useClientNewsReadVersion()

  const items = search.trim()
    ? allItems.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          (a.excerpt || '').toLowerCase().includes(search.toLowerCase()),
      )
    : allItems

  const notifyReadChange = useCallback(() => {
    void qc.invalidateQueries({ queryKey: clientNewsQueryKey })
    emitAppDataChanged({ scope: 'live' })
  }, [qc])

  const openArticle = useCallback(
    async (a: NewsArticle) => {
      if (previewMode) return
      const id = a.id || a._id || ''
      if (id) markNewsArticleRead(id)
      notifyReadChange()
      setActiveSlug(a.slug)
      setSearchParams({ tab: 'noticias', slug: a.slug }, { replace: true })
      setLoadingArticle(true)
      try {
        const res = (await clientPortalContabilApi.getNewsArticle(a.slug)) as { article: NewsArticle }
        setArticle(res.article)
        const aid = res.article.id || res.article._id || id
        if (aid) markNewsArticleRead(aid)
        notifyReadChange()
      } catch (err) {
        toast.error('Não foi possível abrir a notícia', { description: getErrorMessage(err) })
        setActiveSlug(null)
      } finally {
        setLoadingArticle(false)
      }
    },
    [previewMode, notifyReadChange],
  )

  useEffect(() => {
    const onRead = () => void refetch()
    window.addEventListener('cb-client-news-read-changed', onRead)
    return () => window.removeEventListener('cb-client-news-read-changed', onRead)
  }, [refetch])

  const openedSlugRef = useRef<string | null>(null)
  useEffect(() => {
    if (!slugFromUrl || previewMode || openedSlugRef.current === slugFromUrl) return
    const match = allItems.find((a) => a.slug === slugFromUrl)
    if (match) {
      openedSlugRef.current = slugFromUrl
      void openArticle(match)
    }
  }, [slugFromUrl, previewMode, allItems, openArticle])

  if (activeSlug) {
    return (
      <article className="space-y-4">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
          onClick={() => {
            setActiveSlug(null)
            setArticle(null)
            setSearchParams({ tab: 'noticias' }, { replace: true })
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar às notícias
        </button>
        {loadingArticle ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : article ? (
          <div className="cb-card-padded">
            {article.coverUrl ? (
              <img
                src={article.coverUrl}
                alt=""
                className="mb-5 w-full rounded-xl object-cover max-h-72"
              />
            ) : null}
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">{article.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {article.authorName || 'Escritório'}
              {article.publishedAt ? ` · ${formatPtDate(article.publishedAt)}` : ''}
              {article.readingTimeMinutes ? ` · ${article.readingTimeMinutes} min de leitura` : ''}
            </p>
            {article.category ? (
              <span className="cb-chip mt-3 inline-flex">{article.category}</span>
            ) : null}
            <div className="prose prose-sm mt-6 max-w-none whitespace-pre-wrap text-foreground leading-relaxed">
              {article.body}
            </div>
            {article.coverUrl ? (
              <a
                href={article.coverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cb-btn-secondary mt-6 inline-flex"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir imagem em ecrã inteiro
              </a>
            ) : null}
          </div>
        ) : null}
      </article>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Atualizações e comunicados do seu escritório de contabilidade.
      </p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="cb-field-control rounded-full pl-9"
          placeholder="Pesquisar notícias…"
          value={search}
          onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : items.length === 0 ? (
        <div className="cb-empty-state">
          <Newspaper className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            Ainda não há notícias publicadas pelo escritório.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => {
            const id = a.id || a._id || ''
            void readVersion
            const unread = id ? !isNewsArticleRead(id) : false
            return (
              <li key={id || a.slug}>
                <button
                  type="button"
                  onClick={() => void openArticle(a)}
                  className={cn(
                    'cb-card w-full overflow-hidden text-left transition hover:border-brand/25 hover:shadow-md',
                    unread && 'border-brand/25 ring-1 ring-brand/10',
                  )}
                >
                  <div className="flex gap-0 sm:gap-4">
                    {a.coverUrl ? (
                      <img
                        src={a.coverUrl}
                        alt=""
                        className="hidden h-24 w-28 shrink-0 object-cover sm:block"
                      />
                    ) : (
                      <div className="hidden h-24 w-28 shrink-0 items-center justify-center bg-muted/40 sm:flex">
                        <FileText className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {unread ? (
                          <span className="rounded-full bg-brand px-2 py-0.5 text-caption font-bold uppercase tracking-wide text-primary-foreground">
                            Novo
                          </span>
                        ) : (
                          <span className="text-caption font-medium text-muted-foreground">Lido</span>
                        )}
                        {a.category ? (
                          <span className="text-caption text-muted-foreground">{a.category}</span>
                        ) : null}
                      </div>
                      <p className="mt-1 font-semibold text-foreground">{a.title}</p>
                      {a.excerpt ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {a.publishedAt ? formatPtDate(a.publishedAt) : ''}
                        {a.readingTimeMinutes ? ` · ${a.readingTimeMinutes} min` : ''}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {!previewMode ? (
        <Button type="button" variant="outline" className="rounded-full" onClick={() => void refetch()}>
          Actualizar lista
        </Button>
      ) : null}
    </div>
  )
}
