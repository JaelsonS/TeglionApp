import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, Megaphone, Search } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { AlertAttachmentsGrid } from '@/features/firm/alerts/AlertAttachments'
import { CategoryBadge, PriorityBadge } from '@/features/firm/alerts/broadcast-ui'
import { patchAlertFeedSearchParams } from '@/features/client/clientUpdatesSearch'
import { fetchClientAlert, fetchClientAlerts, type ClientAlertItem } from '@/infrastructure/api/contabil/broadcasts'
import { broadcastQueryKeys } from '@/shared/hooks/queries/useBroadcasts'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { clientPortalContabilApi } from '@/infrastructure/api'
import { formatDateTime } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { SkeletonCard } from '@/shared/design-system/Skeleton'

export function ClientAlertsFeed() {
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const alertFromUrl = searchParams.get('alert')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)
  const [category, setCategory] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null)
  const [alertDetail, setAlertDetail] = useState<ClientAlertItem | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const openedAlertRef = useRef<string | null>(null)

  const filterKey = JSON.stringify({ search: debouncedSearch, category })
  const { data, isLoading, refetch } = useQuery({
    queryKey: broadcastQueryKeys.clientFeed(filterKey),
    queryFn: () =>
      fetchClientAlerts({ category: category || undefined, search: debouncedSearch || undefined }),
    staleTime: 30_000,
  })

  const urgentBanner = data?.urgentBanner
  const pinned = data?.pinned || []
  const items = useMemo(() => {
    const rest = (data?.items || []).filter((a) => !a.pinned)
    return rest
  }, [data?.items])

  const invalidateAlerts = useCallback(async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['contabil', 'alerts'] }),
      qc.invalidateQueries({ queryKey: ['client', 'alerts'] }),
      qc.invalidateQueries({ queryKey: broadcastQueryKeys.clientFeed(filterKey) }),
      qc.invalidateQueries({ queryKey: broadcastQueryKeys.clientFeed('bell') }),
    ])
  }, [qc, filterKey])

  async function markRead(alert: ClientAlertItem, acknowledge = false) {
    if (pendingId) return
    setPendingId(alert.id)
    try {
      await clientPortalContabilApi.markAlertRead(alert.id, acknowledge)
      await invalidateAlerts()
      await refetch()
      if (alertDetail?.id === alert.id) {
        setAlertDetail((prev) =>
          prev ? { ...prev, isRead: true, needsAck: acknowledge ? false : prev.needsAck } : prev,
        )
      }
    } catch (err) {
      toast.error('Não foi possível confirmar a leitura', {
        description: getErrorMessage(err),
      })
    } finally {
      setPendingId(null)
    }
  }

  const closeDetail = useCallback(() => {
    setActiveAlertId(null)
    setAlertDetail(null)
    openedAlertRef.current = null
    setSearchParams((prev) => patchAlertFeedSearchParams(prev, null), { replace: true })
  }, [setSearchParams])

  const openAlert = useCallback(
    async (alert: ClientAlertItem) => {
      setActiveAlertId(alert.id)
      setSearchParams((prev) => patchAlertFeedSearchParams(prev, alert.id), { replace: true })
      setLoadingDetail(true)
      try {
        const res = await fetchClientAlert(alert.id)
        const detail = res.alert
        setAlertDetail(detail)
        openedAlertRef.current = alert.id
        if (!detail.isRead || detail.needsAck) {
          setPendingId(detail.id)
          try {
            await clientPortalContabilApi.markAlertRead(detail.id, detail.needsAck)
            await invalidateAlerts()
            await refetch()
            setAlertDetail((prev) =>
              prev ? { ...prev, isRead: true, needsAck: detail.needsAck ? false : prev.needsAck } : prev,
            )
          } catch (err) {
            toast.error('Não foi possível registar a leitura', { description: getErrorMessage(err) })
          } finally {
            setPendingId(null)
          }
        }
      } catch (err) {
        toast.error('Não foi possível abrir o aviso', { description: getErrorMessage(err) })
        closeDetail()
      } finally {
        setLoadingDetail(false)
      }
    },
    [closeDetail, invalidateAlerts, refetch, setSearchParams],
  )

  useEffect(() => {
    if (!alertFromUrl || openedAlertRef.current === alertFromUrl) return
    const match =
      data?.items?.find((a) => a.id === alertFromUrl) ||
      data?.pinned?.find((a) => a.id === alertFromUrl) ||
      (urgentBanner?.id === alertFromUrl ? urgentBanner : null)
    if (match) void openAlert(match)
  }, [alertFromUrl, data?.items, data?.pinned, urgentBanner, openAlert])

  if (activeAlertId) {
    const detail = alertDetail
    const busy = pendingId === activeAlertId
    return (
      <article className="space-y-4" data-testid="client-alert-detail">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
          onClick={closeDetail}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos alertas
        </button>

        {loadingDetail && !detail ? (
          <SkeletonCard />
        ) : detail ? (
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={detail.priority} />
              <CategoryBadge category={detail.category} />
              {detail.dueAt ? (
                <span className="text-xs text-amber-700">Prazo {formatDateTime(detail.dueAt)}</span>
              ) : null}
            </div>
            <h2 className="mt-3 text-xl font-semibold text-foreground">{detail.title}</h2>
            {detail.publishedAt ? (
              <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(detail.publishedAt)}</p>
            ) : null}
            <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {detail.body || detail.excerpt}
            </div>
            {detail.attachments?.length || detail.coverUrl ? (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Anexos
                </p>
                <AlertAttachmentsGrid attachments={detail.attachments || []} coverUrl={detail.coverUrl} />
              </div>
            ) : null}
            {detail.ctaUrl && detail.ctaLabel ? (
              <a
                href={detail.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                {detail.ctaLabel}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
            {detail.needsAck ? (
              <Button
                size="sm"
                className="mt-5 rounded-full"
                disabled={busy}
                onClick={() => void markRead(detail, true)}
              >
                {busy ? 'A confirmar…' : 'Confirmar que li este aviso'}
              </Button>
            ) : detail.isRead ? (
              <p className="mt-5 inline-flex items-center gap-1 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Leitura registada
              </p>
            ) : null}
          </div>
        ) : null}
      </article>
    )
  }

  return (
    <div className="space-y-4">
      {urgentBanner && (!urgentBanner.isRead || urgentBanner.needsAck) ? (
        <div className="rounded-2xl border border-red-300 bg-gradient-to-r from-red-600 to-red-700 p-4 text-white shadow-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="cb-text-label text-red-100">Urgente</p>
              <p className="mt-1 font-semibold">{urgentBanner.title}</p>
              {urgentBanner.excerpt ? <p className="mt-1 text-sm text-red-50">{urgentBanner.excerpt}</p> : null}
              <Button
                size="sm"
                className="mt-3 rounded-full bg-white text-red-700 hover:bg-red-50"
                onClick={() => void openAlert(urgentBanner)}
              >
                Ler aviso completo
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="rounded-full pl-9"
          placeholder="Pesquisar alertas do escritório…"
          aria-label="Pesquisar alertas do escritório"
          value={search}
          onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          {pinned.length > 0 ? (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fixados</p>
              <ul className="space-y-2">
                {pinned.map((a) => (
                  <AlertCard key={a.id} alert={a} onOpen={openAlert} pendingId={pendingId} />
                ))}
              </ul>
            </section>
          ) : null}

          {items.length === 0 && pinned.length === 0 ? (
            <div className="cb-empty-state text-sm text-muted-foreground">
              <Megaphone className="mx-auto mb-2 h-8 w-8 opacity-30" />
              Sem alertas do escritório neste momento.
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((a) => (
                <AlertCard key={a.id} alert={a} onOpen={openAlert} pendingId={pendingId} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

function AlertCard({
  alert,
  onOpen,
  pendingId,
}: {
  alert: ClientAlertItem
  onOpen: (a: ClientAlertItem) => void
  pendingId?: string | null
}) {
  const unread = !alert.isRead || alert.needsAck
  const hasAttachments = Boolean(alert.attachments?.length || alert.coverUrl)

  return (
    <li
      role="button"
      tabIndex={0}
      className={cn(
        'cursor-pointer rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-md',
        unread ? 'border-primary/30 ring-1 ring-primary/10' : 'border-border/50',
        alert.priority === 'URGENT' && unread && 'border-red-200',
      )}
      onClick={() => void onOpen(alert)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') void onOpen(alert)
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <PriorityBadge priority={alert.priority} />
        <CategoryBadge category={alert.category} />
        {alert.dueAt ? (
          <span className="text-xs text-amber-700">Prazo {formatDateTime(alert.dueAt)}</span>
        ) : null}
        {hasAttachments ? (
          <span className="text-xs font-medium text-primary">Com anexo{alert.attachments!.length > 1 ? 's' : ''}</span>
        ) : null}
      </div>
      <h3 className="mt-2 font-semibold text-foreground">{alert.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground whitespace-pre-wrap">
        {alert.excerpt || alert.body}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {alert.publishedAt ? formatDateTime(alert.publishedAt) : ''}
        </span>
        <span
          className={cn(
            'text-xs font-medium',
            unread ? 'text-primary' : 'inline-flex items-center gap-1 text-emerald-700',
          )}
        >
          {unread ? 'Toque para ler →' : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Lido · abrir
            </>
          )}
        </span>
      </div>
    </li>
  )
}
