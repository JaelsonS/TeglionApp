import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

import { FirmMessagesModule } from '@/features/firm/chat/FirmMessagesModule'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/design-system'
import { tasksApi } from '@/infrastructure/api/contabil/tasks'
import { contabilObligationsApi, contabilMessagesApi } from '@/infrastructure/api'
import { formatPtDate } from '@/shared/utils/contabilLocale'
import { withClientQuery } from '@/shared/utils/clientQueryParam'
import type { ClientHubResponse } from '@/infrastructure/api/contabil/types'

type PanelProps = {
  clientId: string
  displayName: string
  hub?: ClientHubResponse
}

function HubPanelShell({
  title,
  description,
  fullModuleHref,
  fullModuleLabel,
  children,
}: {
  title: string
  description?: string
  fullModuleHref: string
  fullModuleLabel: string
  children: ReactNode
}) {
  return (
    <section className="cb-client-hub-panel space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link to={fullModuleHref}>
            {fullModuleLabel}
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      {children}
    </section>
  )
}

export function ClientHubObligationsPanel({ clientId, displayName, hub }: PanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['client-hub-obligations', clientId],
    queryFn: () =>
      contabilObligationsApi.list({ clientId, limit: 50 }) as Promise<{
        items?: Array<{ _id: string; title?: string; type?: string; dueDate?: string; status?: string }>
      }>,
  })

  const items = data?.items?.length
    ? data.items
    : hub?.cards.upcomingDeadlines.map((o) => ({
        _id: o.id,
        title: o.title,
        type: o.type,
        dueDate: o.dueDate,
        status: o.status,
      })) ?? []

  return (
    <HubPanelShell
      title="Obrigações"
      description={`Prazos fiscais de ${displayName}.`}
      fullModuleHref={withClientQuery('/app/firm/tasks/obligations', clientId)}
      fullModuleLabel="Abrir módulo completo"
    >
      {isLoading && items.length === 0 ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem obrigações registadas para esta empresa.</p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card">
          {items.slice(0, 12).map((o) => (
            <li key={o._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <span className="font-medium">{o.title || o.type || 'Obrigação'}</span>
              <span className="text-xs text-muted-foreground">
                {o.dueDate ? formatPtDate(o.dueDate, 'date') : '—'}
                {o.status ? ` · ${o.status}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </HubPanelShell>
  )
}

export function ClientHubDocumentsPanel({ clientId, displayName, hub }: PanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['client-hub-doc-requests', clientId],
    queryFn: () =>
      contabilMessagesApi.listDocumentRequests(clientId) as Promise<{
        items?: Array<{ _id?: string; id?: string; title?: string; status?: string; createdAt?: string }>
      }>,
  })

  const items = data?.items?.length
    ? data.items
    : hub?.cards.pendingDocuments.map((d) => ({
        _id: d.id,
        title: d.title,
        status: 'pending',
        createdAt: d.createdAt,
      })) ?? []

  return (
    <HubPanelShell
      title="Documentos"
      description={`Pedidos e entregas de ${displayName}.`}
      fullModuleHref={`/app/firm/documents/requests?client=${encodeURIComponent(clientId)}`}
      fullModuleLabel="Abrir pedidos"
    >
      {isLoading && items.length === 0 ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem pedidos de documentos activos.</p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card">
          {items.slice(0, 12).map((d) => (
            <li
              key={'_id' in d && d._id ? d._id : 'id' in d ? d.id : d.title}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <span className="font-medium">{d.title || 'Pedido de documentos'}</span>
              <span className="text-xs capitalize text-muted-foreground">{d.status || 'pendente'}</span>
            </li>
          ))}
        </ul>
      )}
    </HubPanelShell>
  )
}

export function ClientHubTasksPanel({ clientId, displayName, hub }: PanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['client-hub-tasks', clientId],
    queryFn: () =>
      tasksApi.list({ clientId, limit: 50 }) as Promise<{
        items?: Array<{ _id?: string; id?: string; title?: string; status?: string; dueDate?: string }>
      }>,
  })

  const items = data?.items?.length
    ? data.items
    : hub?.cards.criticalTasks.map((t) => ({
        _id: t.id,
        title: t.title,
        status: t.status,
        dueDate: t.dueDate,
      })) ?? []

  return (
    <HubPanelShell
      title="Tarefas"
      description={`Tarefas operacionais de ${displayName}.`}
      fullModuleHref={withClientQuery('/app/firm/tasks/manual', clientId)}
      fullModuleLabel="Abrir tarefas"
    >
      {isLoading && items.length === 0 ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem tarefas em aberto.</p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card">
          {items.slice(0, 12).map((t) => (
            <li
              key={'_id' in t && t._id ? t._id : 'id' in t ? t.id : t.title}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <span className="font-medium">{t.title || 'Tarefa'}</span>
              <span className="text-xs text-muted-foreground">
                {t.dueDate ? formatPtDate(t.dueDate, 'date') : t.status || '—'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </HubPanelShell>
  )
}

export function ClientHubMessagesPanel({ clientId, displayName }: PanelProps) {
  return (
    <section className="cb-client-hub-panel flex min-h-[min(70dvh,36rem)] flex-col overflow-hidden p-0 sm:min-h-[32rem]">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Comunicação</h2>
          <p className="text-xs text-muted-foreground">Mensagens com {displayName}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/app/firm/messages?client=${encodeURIComponent(clientId)}`}>
            Abrir caixa de entrada
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <FirmMessagesModule embeddedClientId={clientId} />
      </div>
    </section>
  )
}
