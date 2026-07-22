import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  ClipboardList,
  Clock,
  FileText,
  FileUp,
  Inbox,
  MessageSquare,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'

import { useFirmMessagesUnread } from '@/features/firm/FirmSidebar'
import { FirmOnboardingWizard } from '@/features/firm/onboarding/FirmOnboardingWizard'
import {
  DashKpi,
  DashPanel,
  ObligationDashRows,
  PortfolioBar,
} from '@/features/firm/dashboard/FirmDashboardParts'
import {
  createdInScope,
  dueInScope,
  isSameDay,
  overdueInScope,
  relativeUpdated,
  type PeriodScope,
} from '@/features/firm/dashboard/firmDashboardUtils'
import { AgencyPromoCard } from '@/shared/components/agency/AgencyPromoCard'
import { SkeletonCard } from '@/shared/design-system'
import { useFirmDashboard } from '@/shared/hooks/queries/useFirmDashboard'
import { contabilMessagesApi } from '@/infrastructure/api'
import { formatDate, formatDateTime } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'
import { FirmScrollPage } from '@/features/firm/FirmPageLayout'
import { firmTasksPath } from '@/features/firm/tasks/firmTasksPaths'
import { cn } from '@/shared/lib/utils'

const QUICK_LINKS = [
  { to: '/app/firm/clients', label: 'Nova empresa', icon: Building2 },
  { to: `${firmTasksPath('obligations')}?create=1`, label: 'Nova obrigação', icon: FileText },
  { to: firmTasksPath('manual'), label: 'Nova tarefa', icon: ClipboardList },
  { to: '/app/firm/documents/requests', label: 'Pedir documentos', icon: Inbox },
] as const

export function FirmDashboardPage() {
  const navigate = useNavigate()
  const dashboardQuery = useFirmDashboard(true)
  const data = dashboardQuery.data ?? null
  const loading = dashboardQuery.isLoading
  const loadFailed = dashboardQuery.isError && !data
  const messagesUnread = useFirmMessagesUnread()
  const [scope, setScope] = useState<PeriodScope>('all')
  const [notifying, setNotifying] = useState(false)

  const atRisk = (data?.portfolioHealth?.critical ?? 0) + (data?.portfolioHealth?.attention ?? 0)
  const portfolioTotal =
    (data?.portfolioHealth?.ok ?? 0) +
    (data?.portfolioHealth?.attention ?? 0) +
    (data?.portfolioHealth?.critical ?? 0)

  const criticalItems = useMemo(() => {
    const items = data?.criticalNext48h ?? []
    return items.filter((o) => dueInScope(o.dueDate, scope))
  }, [data?.criticalNext48h, scope])

  const overdueItems = useMemo(() => {
    const items = data?.recentOverdue ?? []
    return items.filter((o) => overdueInScope(o.dueDate, scope))
  }, [data?.recentOverdue, scope])

  const pendingDocsItems = useMemo(() => {
    const items = data?.pendingValidationDocs ?? []
    return items.filter((d) => createdInScope(d.createdAt, scope))
  }, [data?.pendingValidationDocs, scope])

  const kpiOverdue = scope === 'all' ? (data?.obligations.overdue ?? 0) : overdueItems.length
  const kpiCritical = criticalItems.length
  const kpiPendingDocs =
    scope === 'today'
      ? (data?.pendingValidationCountToday ?? pendingDocsItems.length)
      : scope === 'week'
        ? (data?.pendingValidationCountWeek ?? pendingDocsItems.length)
        : (data?.pendingValidationCount ?? 0)
  const kpiTasks =
    scope === 'today'
      ? (data?.tasksOpenToday ?? 0)
      : scope === 'week'
        ? (data?.tasksOpenWeek ?? data?.tasksOpen ?? 0)
        : (data?.tasksOpen ?? 0)
  const tasksKpiSub =
    scope === 'today' ? 'hoje' : scope === 'week' ? 'esta semana' : 'em aberto'

  const todayMeetings = useMemo(() => {
    const now = new Date()
    return (data?.upcomingConsultations ?? []).filter((c) => isSameDay(new Date(c.scheduledAt), now)).slice(0, 5)
  }, [data?.upcomingConsultations])

  const activity = useMemo(() => {
    if (!data) return []
    type Row = {
      id: string
      title: string
      meta: string
      to: string
      icon: 'green' | 'blue' | 'orange'
      Icon: typeof Check
    }
    const rows: Row[] = []

    for (const o of data.criticalNext48h?.slice(0, 2) || []) {
      rows.push({
        id: `c-${o._id}`,
        title: `${o.title || o.type} — ${o.clientName || 'Cliente'}`,
        meta: `Prazo ${formatDate(o.dueDate)} · crítico 48h`,
        to: firmTasksPath('obligations'),
        icon: 'green',
        Icon: Check,
      })
    }
    for (const d of data.pendingValidationDocs?.slice(0, 2) || []) {
      rows.push({
        id: `d-${d._id}`,
        title: `Doc. recebido — ${d.clientName || 'Cliente'}`,
        meta: d.title || 'Validação pendente',
        to: '/app/firm/documents/files',
        icon: 'blue',
        Icon: FileUp,
      })
    }
    for (const c of data.upcomingConsultations?.slice(0, 1) || []) {
      rows.push({
        id: `m-${c._id}`,
        title: c.title || 'Reunião',
        meta: `${formatDateTime(c.scheduledAt)}${c.clientName ? ` · ${c.clientName}` : ''}`,
        to: '/app/firm/agenda',
        icon: 'orange',
        Icon: MessageSquare,
      })
    }

    return rows.slice(0, 5)
  }, [data])

  const notifyCritical = async () => {
    setNotifying(true)
    try {
      const res = (await contabilMessagesApi.notifyCriticalObligations()) as { notified?: number }
      toast.success(`Notificações enviadas (${res.notified ?? 0})`)
      await dashboardQuery.refetch()
    } catch (err) {
      toast.error('Falha ao notificar')
    } finally {
      setNotifying(false)
    }
  }

  const updatedAt = dashboardQuery.dataUpdatedAt

  return (
    <FirmScrollPage>
    <div className="cb-dash-page" data-testid="firm-dashboard">
      <FirmOnboardingWizard className="mb-4" />
      <header className="cb-dash-ph">
        <div className="min-w-0">
          <h1 className="cb-dash-title">Painel operacional</h1>
          <p className="cb-dash-sub">
            Estado da carteira em tempo real · Atualizado {relativeUpdated(updatedAt)}
            {data ? ` · ${data.totalClients} empresas` : ''}
          </p>
        </div>
        <div className="cb-dash-ph-acts">
          <button
            type="button"
            className={cn('cb-dash-btn-sec', scope === 'all' && 'cb-dash-btn-sec-active')}
            onClick={() => setScope('all')}
          >
            Tudo
          </button>
          <button
            type="button"
            className={cn('cb-dash-btn-sec', scope === 'today' && 'cb-dash-btn-sec-active')}
            onClick={() => setScope('today')}
          >
            Hoje
          </button>
          <button
            type="button"
            className={cn('cb-dash-btn-sec', scope === 'week' && 'cb-dash-btn-sec-active')}
            onClick={() => setScope('week')}
          >
            Esta semana
          </button>
          <button type="button" className="cb-dash-btn-primary" onClick={() => navigate(firmTasksPath('manual'))}>
            <Plus className="h-3.5 w-3.5" />
            Nova tarefa
          </button>
        </div>
      </header>

      {loading && !data ? (
        <div className="cb-dash-kpi-row">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : null}

      {loadFailed ? (
        <div className="cb-dash-panel px-4 py-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" aria-hidden />
          <p className="text-sm font-medium text-foreground">Não foi possível carregar o painel</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {getErrorMessage(dashboardQuery.error) || 'Verifique a ligação e tente novamente.'}
          </p>
          <button
            type="button"
            className="cb-dash-btn-primary mt-4"
            onClick={() => void dashboardQuery.refetch()}
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {data ? (
        <>
          <div className="cb-dash-kpi-row">
            <DashKpi
              label="Em atraso"
              sub="obrigações"
              value={kpiOverdue}
              tone="red"
              icon={AlertTriangle}
              onClick={() => navigate(firmTasksPath('obligations'))}
            />
            <DashKpi
              label="Críticas 48h"
              sub="vencem em breve"
              value={kpiCritical}
              tone="red"
              icon={Clock}
              onClick={() => navigate(firmTasksPath('obligations'))}
            />
            <DashKpi
              label="Docs p/ validar"
              sub="aguardam revisão"
              value={kpiPendingDocs}
              tone="orange"
              icon={FileText}
              onClick={() => navigate('/app/firm/documents/files')}
            />
            <DashKpi
              label="Tarefas abertas"
              sub={tasksKpiSub}
              value={kpiTasks}
              tone="neutral"
              icon={ClipboardList}
              onClick={() => navigate(firmTasksPath('manual'))}
            />
            <DashKpi
              label="Clientes em risco"
              sub="carteira crítica"
              value={atRisk}
              tone="orange"
              icon={Building2}
              onClick={() => navigate('/app/firm/clients')}
            />
            <DashKpi
              label="Não lidas"
              sub="mensagens"
              value={messagesUnread}
              tone="blue"
              icon={MessageSquare}
              onClick={() => navigate('/app/firm/messages')}
            />
          </div>

          <div className="cb-dash-cols">
            <div className="flex flex-col gap-3">
              <DashPanel
                title="Prioridade 48h"
                titleIcon={<AlertTriangle className="h-3.5 w-3.5 text-red-600" />}
                linkLabel="ver todas"
                linkTo={firmTasksPath('obligations')}
                headerAction={
                  criticalItems.length > 0 ? (
                    <button
                      type="button"
                      className="cb-text-caption font-medium hover:underline disabled:opacity-50"
                      style={{ color: 'hsl(var(--cb-info))' }}
                      disabled={notifying}
                      onClick={() => void notifyCritical()}
                    >
                      Notificar
                    </button>
                  ) : null
                }
              >
                <ObligationDashRows
                  items={criticalItems}
                  mode="critical"
                  empty="Nada crítico nas próximas 48 horas."
                  pill={(o) => (o.priority === 'URGENT' ? { label: 'Urgente', className: 'cb-pill-orange' } : { label: 'Crítico', className: 'cb-pill-red' })}
                />
              </DashPanel>

              <DashPanel
                title="Obrigações em atraso"
                titleIcon={<AlertCircle className="h-3.5 w-3.5 text-red-600" />}
                linkLabel={`${kpiOverdue} no total`}
                linkTo={firmTasksPath('obligations')}
              >
                <ObligationDashRows
                  items={overdueItems}
                  mode="overdue"
                  empty="Sem atrasos registados."
                  pill={() => ({ label: 'Atraso', className: 'cb-pill-red' })}
                />
              </DashPanel>

              <DashPanel
                title="Documentos pendentes validação"
                titleIcon={<Inbox className="h-3.5 w-3.5 text-orange-600" />}
                linkLabel={`${kpiPendingDocs} por rever`}
                linkTo="/app/firm/documents/files"
              >
                {pendingDocsItems.length === 0 ? (
                  <p className="cb-dash-empty">Fila de validação vazia.</p>
                ) : (
                  <ul>
                    {pendingDocsItems.slice(0, 6).map((d, i) => (
                      <li key={d._id}>
                        <Link to="/app/firm/documents/files" className="cb-dash-row">
                          <span
                            className={cn(
                              'cb-dash-row-ico',
                              i % 3 === 2 ? 'cb-dash-row-ico-blue' : 'cb-dash-row-ico-orange',
                            )}
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </span>
                          <span className="cb-dash-row-body">
                            <span className="cb-dash-row-name">
                              {d.title || 'Documento'} — {d.clientName || 'Cliente'}
                            </span>
                            <span className="cb-dash-row-meta">
                              {d.createdAt ? `Recebido ${formatDate(d.createdAt)}` : 'Aguarda validação'}
                            </span>
                          </span>
                          <span className="cb-dash-row-end">
                            <span className={cn('cb-pill', i % 2 === 0 ? 'cb-pill-amber' : 'cb-pill-blue')}>
                              {i % 2 === 0 ? 'Pendente' : 'Novo'}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </DashPanel>
            </div>

            <aside className="flex flex-col gap-3">
              <section className="cb-dash-panel">
                <div className="cb-dash-panel-hd">
                  <span className="cb-dash-panel-title">Estado da carteira</span>
                </div>
                <div className="cb-dash-bar-wrap">
                  <PortfolioBar
                    label="Em dia"
                    count={data.portfolioHealth?.ok ?? 0}
                    pct={data.portfolioHealth?.pctOk ?? 0}
                    color="bg-emerald-500"
                    labelClass="text-emerald-600 font-medium"
                  />
                  <PortfolioBar
                    label="Atenção"
                    count={data.portfolioHealth?.attention ?? 0}
                    pct={data.portfolioHealth?.pctAttention ?? 0}
                    color="bg-orange-500"
                    labelClass="text-orange-600 font-medium"
                  />
                  <PortfolioBar
                    label="Crítico"
                    count={data.portfolioHealth?.critical ?? 0}
                    pct={data.portfolioHealth?.pctCritical ?? 0}
                    color="bg-red-500"
                    labelClass="text-red-600 font-medium"
                  />
                  <p className="pt-1 cb-text-caption">
                    {portfolioTotal} empresas activas no total
                  </p>
                </div>
              </section>

              <DashPanel
                title="Agenda hoje"
                titleIcon={<Calendar className="h-3.5 w-3.5 text-sky-600" />}
                linkLabel="ver agenda"
                linkTo="/app/firm/agenda"
              >
                {todayMeetings.length === 0 ? (
                  <p className="cb-dash-empty">Sem reuniões hoje.</p>
                ) : (
                  <div className="px-3.5 py-2">
                    {todayMeetings.map((c, i) => (
                      <div key={c._id} className="cb-dash-cal-day">
                        <span
                          className={cn(
                            'cb-dash-cal-dot',
                            i === 0 && 'cb-dash-cal-dot-brand',
                            i === 1 && 'cb-dash-cal-dot-info',
                            i === 2 && 'cb-dash-cal-dot-success',
                          )}
                        />
                        <div className="min-w-0">
                          <p className="cb-dash-cal-evt">
                            {c.title || 'Reunião'} — {c.clientName || 'Cliente'}
                          </p>
                          <p className="cb-dash-cal-time">{formatDateTime(c.scheduledAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DashPanel>

              <DashPanel title="Atividade recente" titleIcon={<Check className="h-3.5 w-3.5 text-muted-foreground" />}>
                {activity.length === 0 ? (
                  <p className="cb-dash-empty">Sem movimento recente.</p>
                ) : (
                  <ul>
                    {activity.map((row) => (
                      <li key={row.id}>
                        <Link to={row.to} className="cb-dash-row">
                          <span className={cn('cb-dash-row-ico', `cb-dash-row-ico-${row.icon}`)}>
                            <row.Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="cb-dash-row-body">
                            <span className="cb-dash-row-name">{row.title}</span>
                            <span className="cb-dash-row-meta">{row.meta}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </DashPanel>

              <section className="cb-dash-panel">
                <div className="cb-dash-panel-hd">
                  <span className="cb-dash-panel-title">Atalhos rápidos</span>
                </div>
                <div className="cb-dash-shortcuts">
                  {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
                    <Link key={to} to={to} className="cb-dash-sc">
                      <Icon className="h-3.5 w-3.5 text-brand" />
                      {label}
                    </Link>
                  ))}
                </div>
              </section>

              <AgencyPromoCard />
            </aside>
          </div>
        </>
      ) : null}
    </div>
    </FirmScrollPage>
  )
}
