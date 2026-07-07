import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  FileStack,
  Inbox,
  Megaphone,
  MessageSquare,
} from 'lucide-react'

import {
  ClientHubDocumentsPanel,
  ClientHubMessagesPanel,
  ClientHubObligationsPanel,
  ClientHubTasksPanel,
} from '@/features/firm/client-hub/ClientHubSectionPanels'
import { FirmScrollPage } from '@/features/firm/FirmPageLayout'
import { ClientHubHeader } from '@/features/firm/client-hub/ClientHubHeader'
import { ClientHubProfilePanel } from '@/features/firm/client-hub/ClientHubProfilePanel'
import { ClientHubHistory } from '@/features/firm/client-hub/ClientHubHistory'
import { deriveRiskReason } from '@/features/firm/client-hub/clientHubUtils'
import { ClientHubOverviewMetrics } from '@/features/firm/client-hub/ClientHubOverviewMetrics'
import { CLIENT_HUB_SECTIONS, type ClientHubSection } from '@/features/firm/client-hub/sections'
import { Button } from '@/shared/components/ui/button'
import { SegmentedControl, Skeleton, SkeletonCard } from '@/shared/design-system'
import { useClientHub, usePatchClient } from '@/shared/hooks/queries/useClientHub'
import { formatDateTime } from '@/shared/utils/date'
import { cn } from '@/shared/lib/utils'

export function FirmClientHubPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const [section, setSection] = useState<ClientHubSection>('overview')

  const { data: hub, isLoading, isError, refetch, isFetching } = useClientHub(clientId)
  const patch = usePatchClient(clientId || '')

  const displayName = useMemo(() => {
    if (!hub) return ''
    return hub.client.fiscalProfile?.legalName || hub.client.displayName || hub.client.name
  }, [hub])

  if (!clientId) return null

  if (isLoading) {
    return (
      <FirmScrollPage className="cb-client-hub-page">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-10 w-full max-w-xl rounded-xl" />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </FirmScrollPage>
    )
  }

  if (isError || !hub) {
    return (
      <FirmScrollPage className="cb-client-hub-page">
        <div className="cb-client-hub-panel p-6">
          <p className="text-sm text-muted-foreground">Não foi possível carregar a central desta empresa.</p>
          <Button variant="outline" className="mt-3 rounded-md" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      </FirmScrollPage>
    )
  }

  const cid = hub.client._id || hub.client.id || clientId
  const riskReason = deriveRiskReason(hub)

  const navOptions = CLIENT_HUB_SECTIONS.map((s) => ({
    id: s.id,
    label: s.label,
    icon: s.icon,
  }))

  function onSectionChange(id: ClientHubSection) {
    setSection(id)
  }

  const hubShortcuts = [
    { id: 'obligations' as const, label: 'Obrigações', icon: ClipboardList },
    { id: 'documents' as const, label: 'Documentos', icon: Inbox },
    { id: 'tasks' as const, label: 'Tarefas', icon: FileStack },
    { id: 'messages' as const, label: 'Mensagens', icon: MessageSquare },
  ]

  return (
    <FirmScrollPage className="cb-client-hub-page">
      {isFetching && !isLoading ? (
        <p className="mb-2 text-xs text-muted-foreground animate-pulse">A actualizar…</p>
      ) : null}

      <div className="cb-client-hub-panel shrink-0">
        <ClientHubHeader
          hub={hub}
          displayName={displayName}
          clientId={cid}
          onBack={() => navigate('/app/firm/clients')}
          onEdit={() => setSection('profile')}
        />

        <div className="cb-firm-underline-tabs cb-client-hub-tabs overflow-x-auto px-4">
          <SegmentedControl
            value={section}
            onChange={onSectionChange}
            options={navOptions}
            className="inline-flex w-max min-w-full flex-nowrap border-0 bg-transparent p-0 shadow-none"
          />
        </div>
      </div>

      <div className="cb-client-hub-body min-w-0 w-full max-w-full pt-4">
        {section === 'overview' ? (
          <div className="space-y-4">
            <div className="cb-client-hub-shortcuts">
              {hubShortcuts.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className="cb-client-hub-shortcut"
                  onClick={() => onSectionChange(id)}
                >
                  <Icon className="mx-auto h-[18px] w-[18px] text-brand" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <ClientHubOverviewMetrics hub={hub} clientId={cid} riskReason={riskReason} />

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="cb-surface">
                <div className="cb-surface-header">
                  <h2 className="cb-section-title flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                    Obrigações próximas
                  </h2>
                </div>
                <div className="cb-surface-body">
                  {hub.cards.upcomingDeadlines.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem prazos próximos.</p>
                  ) : (
                    <ul className="divide-y divide-border/50">
                      {hub.cards.upcomingDeadlines.map((o) => (
                        <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                          <span className="font-medium">{o.title}</span>
                          <span className="cb-pill cb-pill-orange text-caption">{formatDateTime(o.dueDate)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              <section className="cb-surface">
                <div className="cb-surface-header">
                  <h2 className="cb-section-title flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                    Alertas de risco
                  </h2>
                </div>
                <div className="cb-surface-body space-y-2">
                  {riskReason ? (
                    <div
                      className={cn(
                        'rounded-md border px-3 py-2 text-xs',
                        hub.summary.riskScore > 0
                          ? 'border-orange-200 bg-orange-50 text-orange-900'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-900',
                      )}
                    >
                      {riskReason}
                    </div>
                  ) : null}
                  {hub.cards.criticalTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma tarefa urgente.</p>
                  ) : (
                    <ul className="space-y-2">
                      {hub.cards.criticalTasks.map((t) => (
                        <li key={t.id} className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                          <span className="font-medium">{t.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            {(hub.alerts?.items?.length ?? 0) > 0 ? (
              <section className="cb-surface border-amber-200/60 bg-amber-50/30">
                <div className="cb-surface-header">
                  <h2 className="cb-section-title flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-amber-700" />
                    Comunicados
                  </h2>
                </div>
                <div className="cb-surface-body">
                  <ul className="space-y-2">
                    {hub.alerts!.items.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{a.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {a.isRead ? 'Lido' : a.needsAck ? 'Confirmação pendente' : 'Por ler'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : null}

            <section className="cb-surface">
              <div className="cb-surface-header">
                <h2 className="cb-section-title">Actividade recente</h2>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSection('timeline')}>
                  Ver tudo
                </Button>
              </div>
              <div className="cb-surface-body">
                <ClientHubHistory items={hub.timeline.slice(0, 6)} />
              </div>
            </section>
          </div>
        ) : null}

        {section === 'profile' ? (
          <div className="cb-client-hub-panel p-4 sm:p-5">
            <ClientHubProfilePanel hub={hub} isSaving={patch.isPending} onPatch={(payload) => patch.mutate(payload)} />
            {hub.profileHistory.length > 0 ? (
              <section className="mt-6 border-t border-border/60 pt-6">
                <h3 className="text-sm font-semibold">Histórico de alterações</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {hub.profileHistory.map((h) => (
                    <li key={h.id}>
                      {formatDateTime(h.createdAt)} — {h.title}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}

        {section === 'timeline' ? (
          <section className="cb-client-hub-panel p-4 sm:p-5">
            <h2 className="text-lg font-semibold tracking-tight">Histórico operacional</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tudo o que acontece com esta empresa — num único feed.
            </p>
            <div className="mt-6">
              <ClientHubHistory items={hub.timeline} />
            </div>
          </section>
        ) : null}

        {section === 'obligations' ? (
          <ClientHubObligationsPanel clientId={cid} displayName={displayName} hub={hub} />
        ) : null}

        {section === 'documents' ? (
          <ClientHubDocumentsPanel clientId={cid} displayName={displayName} hub={hub} />
        ) : null}

        {section === 'tasks' ? (
          <ClientHubTasksPanel clientId={cid} displayName={displayName} hub={hub} />
        ) : null}

        {section === 'messages' ? (
          <ClientHubMessagesPanel clientId={cid} displayName={displayName} hub={hub} />
        ) : null}
      </div>
    </FirmScrollPage>
  )
}
