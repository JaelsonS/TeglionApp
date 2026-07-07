import {
  BarChart3,
  Loader2,
  Pin,
  Send,
  Trash2,
  Users,
} from 'lucide-react'

import { AlertAttachmentsGrid } from '@/features/firm/alerts/AlertAttachments'
import { CategoryBadge, PriorityBadge } from '@/features/firm/alerts/broadcast-ui'
import { STATUS_LABELS } from '@/features/firm/alerts/alertLabels'
import { Button } from '@/shared/components/ui/button'
import { EmptyState } from '@/shared/design-system'
import type { FirmBroadcast } from '@/infrastructure/api/contabil/broadcasts'
import { formatDateTime } from '@/shared/utils/date'
import { cn } from '@/shared/lib/utils'

type Props = {
  item: FirmBroadcast | null
  onEdit: () => void
  onDelete: () => void
  onAnalytics: () => void
  onPublish?: () => void
  /** Dentro de FirmSplitView — sem borda/card duplicado */
  embedded?: boolean
}

export function AlertPreviewPanel({ item, onEdit, onDelete, onAnalytics, onPublish, embedded }: Props) {
  if (!item) {
    return (
      <div
        className={cn(
          'flex h-full min-h-0 flex-col items-center justify-center p-6',
          !embedded && 'min-h-[280px] rounded-xl border border-dashed border-border/60 bg-muted/10',
        )}
      >
        <EmptyState
          title="Selecione um alerta"
          description="Escolha um comunicado na lista para pré-visualizar o conteúdo, destinatários e estatísticas."
        />
      </div>
    )
  }

  const isUrgent = item.priority === 'URGENT'

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden bg-card',
        !embedded && 'rounded-xl border shadow-sm',
        embedded ? 'border-0 shadow-none' : isUrgent ? 'border-red-200/80' : 'border-border/50',
        embedded && isUrgent && 'ring-1 ring-inset ring-red-200/60',
      )}
    >
      <div className="border-b border-border/40 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {item.pinned ? <Pin className="h-3.5 w-3.5 text-primary" /> : null}
          <PriorityBadge priority={item.priority} />
          <CategoryBadge category={item.category} />
          <span className="rounded-full bg-muted px-2 py-0.5 text-caption font-medium text-muted-foreground">
            {STATUS_LABELS[item.status] || item.status}
          </span>
        </div>
        <h2 className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">{item.title}</h2>
        {item.excerpt ? (
          <p className="mt-1 text-sm text-muted-foreground">{item.excerpt}</p>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {item.body}
        </div>

        {(item.attachments?.length || item.coverUrl) ? (
          <div className="mt-5">
            <p className="cb-field-label mb-2">Anexos</p>
            <AlertAttachmentsGrid
              attachments={item.attachments || []}
              coverUrl={item.coverUrl}
            />
          </div>
        ) : null}

        <dl className="mt-6 grid gap-3 rounded-xl bg-muted/30 p-4 text-sm">
          <div>
            <dt className="text-caption font-medium uppercase text-muted-foreground">Destinatários</dt>
            <dd className="mt-0.5 font-medium">
              {item.targetType === 'ALL_CLIENTS'
                ? 'Todos os clientes'
                : `${item.targetClientIds?.length || 0} clientes selecionados`}
            </dd>
          </div>
          {item.publishedAt ? (
            <div>
              <dt className="text-caption font-medium uppercase text-muted-foreground">Publicado</dt>
              <dd className="mt-0.5">{formatDateTime(item.publishedAt)}</dd>
            </div>
          ) : null}
          {item.dueAt ? (
            <div>
              <dt className="text-caption font-medium uppercase text-muted-foreground">Prazo</dt>
              <dd className="mt-0.5">{formatDateTime(item.dueAt)}</dd>
            </div>
          ) : null}
          {item.status === 'PUBLISHED' ? (
            <div>
              <dt className="text-caption font-medium uppercase text-muted-foreground">Leitura</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {item.readCount ?? 0} / {item.deliveryCount ?? 0} lidos
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border/40 p-3">
        <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={onEdit}>
          Editar
        </Button>
        {item.status === 'PUBLISHED' ? (
          <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={onAnalytics}>
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
            Estatísticas
          </Button>
        ) : onPublish ? (
          <Button size="sm" className="h-8 rounded-lg" onClick={onPublish}>
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Publicar
          </Button>
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

export function AlertAnalyticsPanel({
  loading,
  analytics,
}: {
  loading: boolean
  analytics: Record<string, unknown> | null
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!analytics?.metrics) return null
  const m = analytics.metrics as { readRate?: number; read?: number; delivered?: number }
  return (
    <div className="space-y-3 text-sm">
      <p className="flex items-center gap-2 font-semibold">
        <Users className="h-4 w-4" />
        Envolvimento
      </p>
      <p>
        Taxa de leitura: <strong>{m.readRate ?? 0}%</strong>
      </p>
      <p>
        Lidos: {m.read} / {m.delivered}
      </p>
      <p className="text-xs text-muted-foreground">
        {(analytics.pendingClients as unknown[])?.length || 0} clientes pendentes
      </p>
    </div>
  )
}
