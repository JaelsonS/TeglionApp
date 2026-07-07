import { useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Megaphone, Search } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { CategoryBadge, PriorityBadge } from '@/features/firm/alerts/broadcast-ui'
import { fetchClientAlerts, type ClientAlertItem } from '@/infrastructure/api/contabil/broadcasts'
import { broadcastQueryKeys } from '@/shared/hooks/queries/useBroadcasts'
import { clientPortalContabilApi } from '@/infrastructure/api'
import { formatDateTime } from '@/shared/utils/date'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { SkeletonCard } from '@/shared/design-system/Skeleton'

export function ClientAlertsFeed() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const qc = useQueryClient()

  const filterKey = JSON.stringify({ search, category })
  const { data, isLoading, refetch } = useQuery({
    queryKey: broadcastQueryKeys.clientFeed(filterKey),
    queryFn: () => fetchClientAlerts({ category: category || undefined, search: search || undefined }),
    staleTime: 30_000,
  })

  const urgentBanner = data?.urgentBanner
  const pinned = data?.pinned || []
  const items = useMemo(() => {
    const rest = (data?.items || []).filter((a) => !a.pinned)
    return rest
  }, [data?.items])

  async function markRead(alert: ClientAlertItem, acknowledge = false) {
    await clientPortalContabilApi.markAlertRead(alert.id, acknowledge)
    void qc.invalidateQueries({ queryKey: ['contabil', 'alerts'] })
    void qc.invalidateQueries({ queryKey: broadcastQueryKeys.clientFeed('bell') })
    void refetch()
  }

  return (
    <div className="space-y-4">
      {urgentBanner && (!urgentBanner.isRead || urgentBanner.needsAck) ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-red-300 bg-gradient-to-r from-red-600 to-red-700 p-4 text-white shadow-lg"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="cb-text-label text-red-100">Urgente</p>
              <p className="mt-1 font-semibold">{urgentBanner.title}</p>
              {urgentBanner.excerpt ? <p className="mt-1 text-sm text-red-50">{urgentBanner.excerpt}</p> : null}
              {urgentBanner.needsAck ? (
                <Button
                  size="sm"
                  className="mt-3 rounded-full bg-white text-red-700 hover:bg-red-50"
                  onClick={() => void markRead(urgentBanner, true)}
                >
                  Confirmar leitura
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3 rounded-full"
                  onClick={() => void markRead(urgentBanner)}
                >
                  Marcar como lido
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="rounded-full pl-9"
          placeholder="Pesquisar alertas do escritório…"
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
                  <AlertCard key={a.id} alert={a} onRead={markRead} pinned />
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
                <AlertCard key={a.id} alert={a} onRead={markRead} />
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
  onRead,
  pinned,
}: {
  alert: ClientAlertItem
  onRead: (a: ClientAlertItem, ack?: boolean) => Promise<void>
  pinned?: boolean
}) {
  const unread = !alert.isRead || alert.needsAck

  return (
    <li
      role="button"
      tabIndex={0}
      className={cn(
        'cursor-pointer rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-md',
        unread ? 'border-primary/30 ring-1 ring-primary/10' : 'border-border/50 opacity-90',
        alert.priority === 'URGENT' && unread && 'border-red-200',
      )}
      onClick={() => {
        if (unread) void onRead(alert, alert.needsAck)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && unread) void onRead(alert, alert.needsAck)
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <PriorityBadge priority={alert.priority} />
        <CategoryBadge category={alert.category} />
        {pinned ? <span className="text-caption font-medium text-primary">Fixado</span> : null}
        {alert.dueAt ? (
          <span className="text-xs text-amber-700">Prazo {formatDateTime(alert.dueAt)}</span>
        ) : null}
      </div>
      <h3 className="mt-2 font-semibold text-foreground">{alert.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{alert.excerpt || alert.body}</p>
      {alert.ctaUrl && alert.ctaLabel ? (
        <a
          href={alert.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
        >
          {alert.ctaLabel} →
        </a>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {alert.publishedAt ? formatDateTime(alert.publishedAt) : ''}
        </span>
        {unread ? (
          <Button
            size="sm"
            variant={alert.needsAck ? 'default' : 'outline'}
            className="rounded-full h-8"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation()
              void onRead(alert, alert.needsAck)
            }}
          >
            {alert.needsAck ? 'Confirmar' : 'Marcar lido'}
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Lido
          </span>
        )}
      </div>
    </li>
  )
}
