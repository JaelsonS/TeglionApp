import { Eye, EyeOff } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

export type ViewStats = {
  viewCount?: number
  totalViews?: number
  uniqueViewers?: number
  clientViewCount?: number
  isViewed?: boolean
  lastViewedAt?: string | null
  firstViewedAt?: string | null
  views?: Array<{
    id?: string
    label: string
    viewerRole?: string
    viewerName?: string
    deviceType?: string
    deviceLabel?: string
    durationSeconds?: number
    createdAt?: string
  }>
  lastClientView?: {
    label: string
    viewerName?: string
    deviceLabel?: string
    createdAt?: string
  } | null
}

function formatPt(iso?: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleString('pt-PT', {
    timeZone: 'Europe/Lisbon',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ViewTrackingBadge({ stats, compact }: { stats: ViewStats; compact?: boolean }) {
  const viewed =
    stats.isViewed === true ||
    (stats.clientViewCount ?? 0) > 0 ||
    Boolean(stats.lastClientView)
  const lastLabel = stats.lastClientView?.label
    ? stats.lastClientView.label
    : viewed && stats.lastViewedAt
      ? `Cliente visualizou em ${formatPt(stats.lastViewedAt)}`
      : null

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
          viewed ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800',
        )}
      >
        {viewed ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        {viewed ? 'Visualizado' : 'Não visualizado'}
      </span>
    )
  }

  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2.5 text-xs',
        viewed ? 'border-emerald-200/80 bg-emerald-50/50 text-emerald-900' : 'border-amber-200/80 bg-amber-50/50 text-amber-900',
      )}
    >
      <div className="flex items-center gap-2 font-semibold">
        {viewed ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        {viewed ? 'Visualizado pelo cliente' : 'Ainda não visualizado'}
        {viewed && (stats.viewCount ?? 0) > 0 ? (
          <span className="font-normal text-emerald-700/80">· {stats.viewCount ?? 0}×</span>
        ) : null}
      </div>
      {lastLabel ? <p className="mt-1 text-[11px] opacity-90">{lastLabel}</p> : null}
      {!viewed ? (
        <p className="mt-1 text-[11px] opacity-75">
          O registo de visualização ajuda a evitar mal-entendidos sobre entrega de documentos.
        </p>
      ) : null}
    </div>
  )
}
