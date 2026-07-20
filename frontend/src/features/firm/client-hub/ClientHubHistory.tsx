import {
  AlertTriangle,
  Building2,
  ClipboardList,
  ExternalLink,
  FileStack,
  MessageSquare,
  ScrollText,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  activityItemIsNavigable,
  resolveActivityNav,
} from '@/features/firm/client-hub/clientHubActivityLinks'
import type { ClientHubTimelineItem } from '@/infrastructure/api/contabil/types'
import { documentValidationLabel } from '@/shared/utils/contabilLocale'
import { formatDateTime } from '@/shared/utils/date'
import { cn } from '@/shared/lib/utils'

const KIND_META: Record<
  ClientHubTimelineItem['kind'],
  { icon: typeof MessageSquare; className: string; verb: string }
> = {
  message: { icon: MessageSquare, className: 'bg-sky-500/10 text-sky-700', verb: 'Mensagem' },
  document: { icon: FileStack, className: 'bg-violet-500/10 text-violet-700', verb: 'Documento' },
  task: { icon: ScrollText, className: 'bg-amber-500/10 text-amber-800', verb: 'Tarefa' },
  obligation: { icon: ClipboardList, className: 'bg-indigo-500/10 text-indigo-700', verb: 'Obrigação' },
  profile: { icon: Building2, className: 'bg-slate-500/10 text-slate-700', verb: 'Perfil' },
  alert: { icon: AlertTriangle, className: 'bg-red-500/10 text-red-700', verb: 'Alerta' },
  activity: { icon: Building2, className: 'bg-slate-500/10 text-slate-600', verb: 'Actividade' },
}

const TASK_STATUS_PT: Record<string, string> = {
  TODO: 'por iniciar',
  IN_PROGRESS: 'em curso',
  WAITING_CLIENT: 'à espera do cliente',
  DONE: 'concluída',
  OPEN: 'aberta',
  SUBMITTED: 'submetida',
}

function humanizeDescription(item: ClientHubTimelineItem): string | null {
  if (!item.description) return null
  const d = String(item.description)
  if (item.kind === 'document') {
    const label = documentValidationLabel(d)
    return label !== d ? `Estado: ${label}` : d
  }
  if (item.kind === 'task') {
    return TASK_STATUS_PT[d] || d.replace(/_/g, ' ').toLowerCase()
  }
  if (item.kind === 'message') {
    return d.length > 120 ? `${d.slice(0, 120)}…` : d
  }
  return d.replace(/_/g, ' ')
}

function humanizeTitle(item: ClientHubTimelineItem): string {
  if (item.kind === 'message' && item.title) return item.title
  if (item.kind === 'document') return item.title || 'Novo documento'
  if (item.kind === 'task') return item.title ? `Tarefa: ${item.title}` : 'Tarefa actualizada'
  if (item.kind === 'obligation') return item.title || 'Obrigação fiscal'
  if (item.kind === 'profile') return item.title || 'Dados da empresa actualizados'
  return item.title || 'Evento operacional'
}

function actorLine(item: ClientHubTimelineItem): string | null {
  if (item.actorName) {
    const role =
      item.actorRole === 'CLIENT'
        ? 'Cliente'
        : item.actorRole === 'FIRM'
          ? 'Escritório'
          : null
    return role ? `${item.actorName} · ${role}` : item.actorName
  }
  if (item.actorRole === 'CLIENT') return 'Cliente'
  if (item.actorRole === 'FIRM') return 'Escritório'
  return null
}

type ClientHubHistoryProps = {
  items: ClientHubTimelineItem[]
  clientId: string
  onOpenProfile?: () => void
}

function HistoryCardBody({ item }: { item: ClientHubTimelineItem }) {
  const meta = KIND_META[item.kind] || KIND_META.activity
  const Icon = meta.icon
  const desc = humanizeDescription(item)

  return (
    <>
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          meta.className,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <span className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
              {meta.verb}
            </span>
            <p className="text-sm font-medium text-foreground">{humanizeTitle(item)}</p>
          </div>
          <time className="shrink-0 text-xs text-muted-foreground">{formatDateTime(item.at)}</time>
        </div>
        {desc ? <p className="mt-1 text-sm text-muted-foreground">{desc}</p> : null}
        {actorLine(item) ? (
          <p className="mt-1.5 text-xs text-muted-foreground/80">{actorLine(item)}</p>
        ) : null}
      </div>
    </>
  )
}

export function ClientHubHistory({ items, clientId, onOpenProfile }: ClientHubHistoryProps) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/15 px-6 py-14 text-center">
        <p className="font-display text-sm font-medium text-foreground">Sem actividade ainda</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Mensagens, documentos e tarefas desta empresa aparecem aqui em tempo real.
        </p>
      </div>
    )
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => {
        const navigable = activityItemIsNavigable(clientId, item)
        const target = navigable ? resolveActivityNav(clientId, item) : null
        const title = humanizeTitle(item)
        const cardClass = cn(
          'flex w-full gap-3 rounded-2xl border border-border/40 bg-card/80 p-4 text-left shadow-sm transition',
          navigable
            ? 'cursor-pointer hover:border-brand/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40'
            : 'hover:border-border/70',
        )

        const body = (
          <>
            <HistoryCardBody item={item} />
            {navigable ? (
              <ExternalLink
                className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-60"
                aria-hidden
              />
            ) : null}
          </>
        )

        if (target?.type === 'href') {
          return (
            <li key={item.id}>
              <Link
                to={target.href}
                className={cardClass}
                aria-label={`Abrir ${title}`}
              >
                {body}
              </Link>
            </li>
          )
        }

        if (target?.type === 'profile') {
          return (
            <li key={item.id}>
              <button
                type="button"
                className={cardClass}
                aria-label={`Abrir ${title}`}
                onClick={() => onOpenProfile?.()}
              >
                {body}
              </button>
            </li>
          )
        }

        return (
          <li key={item.id} className={cardClass}>
            {body}
          </li>
        )
      })}
    </ol>
  )
}
