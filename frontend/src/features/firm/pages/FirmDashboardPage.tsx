import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
import { useFirmProgress } from '@/features/firm/onboarding/useFirmProgress'
import { FirmActivationChecklist } from '@/features/firm/dashboard/FirmActivationChecklist'
import { FirmNextStepCard, FirmPublicUrlCard } from '@/features/firm/dashboard/FirmNextStepCard'
import {
  DashKpi,
  DashPanel,
  DashSectionHeading,
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
import { AskMayaButton } from '@/features/maya'
import { openActivationAssistant } from '@/features/firm/activation/openActivationAssistant'
import { ClientsSpreadsheetDialog } from '@/features/firm/clients/ClientsSpreadsheetDialog'
import { CLIENTS_CSV_IMPORT_OPEN_EVENT } from '@/features/firm/clients/openClientsCsvImport'
import { Button } from '@/shared/components/ui/button'
import { EmptyState, SkeletonCard } from '@/shared/design-system'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { useFirmDashboard } from '@/shared/hooks/queries/useFirmDashboard'
import { useAuth } from '@/shared/hooks/useAuth'
import { contabilMessagesApi } from '@/infrastructure/api'
import { formatDate, formatDateTime } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'
import { FirmScrollPage } from '@/features/firm/FirmPageLayout'
import { firmTasksPath } from '@/features/firm/tasks/firmTasksPaths'
import { cn } from '@/shared/lib/utils'

const QUICK_LINKS = [
  { to: '/app/firm/services', label: 'Serviços', icon: ClipboardList },
  { to: '/app/firm/clients', label: 'Clientes', icon: Building2 },
  { to: '/app/firm/documents/requests', label: 'Pedir documentos', icon: Inbox },
  { to: firmTasksPath('obligations'), label: 'Obrigações', icon: FileText },
] as const

export function FirmDashboardPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()

  useEffect(() => {
    if (searchParams.get('activation') !== '1') return
    openActivationAssistant()
    const next = new URLSearchParams(searchParams)
    next.delete('activation')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])
  const dashboardQuery = useFirmDashboard(true)
  const { progress, loading: progressLoading } = useFirmProgress(true)
  const data = dashboardQuery.data ?? null
  const loading = dashboardQuery.isLoading
  const loadFailed = dashboardQuery.isError && !data
  const messagesUnread = useFirmMessagesUnread()
  const [scope, setScope] = useState<PeriodScope>('all')
  const [notifying, setNotifying] = useState(false)
  const [csvImportOpen, setCsvImportOpen] = useState(false)

  useEffect(() => {
    function onCsv() {
      setCsvImportOpen(true)
    }
    window.addEventListener(CLIENTS_CSV_IMPORT_OPEN_EVENT, onCsv)
    return () => window.removeEventListener(CLIENTS_CSV_IMPORT_OPEN_EVENT, onCsv)
  }, [])

  const firstName = String(user?.fullName || '')
    .trim()
    .split(/\s+/)[0]
  const greeting = firstName ? `Olá, ${firstName}` : 'Painel do gabinete'
  const isFirmOwner =
    user?.role === 'FIRM_OWNER' ||
    user?.role === 'PLATFORM_OWNER' ||
    user?.firmRole === 'FIRM_OWNER' ||
    user?.permissions?.includes('firm:owner')

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
    } catch {
      toast.error('Falha ao notificar')
    } finally {
      setNotifying(false)
    }
  }

  const updatedAt = dashboardQuery.dataUpdatedAt
  const publicPublished = Boolean(progress?.steps.find((s) => s.id === 'publicPage')?.done)
  const pageSubtitle = `Prioridades, prazos e atalhos do gabinete. Actualizado ${relativeUpdated(updatedAt)}${
    data ? ` · ${data.totalClients} clientes na carteira` : ''
  }`

  const headerRight = (
    <div className="flex flex-wrap items-center gap-2">
      <AskMayaButton intentId="setup" />
      <Button type="button" size="sm" variant="outline" asChild>
        <Link to="/manual/primeiros-passos">Guia</Link>
      </Button>
      <Button type="button" size="sm" onClick={() => navigate(firmTasksPath('manual'))}>
        <Plus className="mr-1 h-4 w-4" />
        Nova tarefa
      </Button>
    </div>
  )

  return (
    <FirmScrollPage className="cb-dash-layout-page">
      <div className="cb-firm-operational-panel cb-dash-layout-panel flex min-w-0 flex-1 flex-col">
        <FirmModuleShell
          className="cb-dash-page-shell cb-dash-page-scroll"
          title={greeting}
          subtitle={pageSubtitle}
          headerRight={headerRight}
          bodyClassName="gap-0"
        >
          <div className="cb-dash-toolbar" role="group" aria-label="Filtrar indicadores por período">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ['all', 'Tudo'],
                  ['today', 'Hoje'],
                  ['week', 'Esta semana'],
                ] as const
              ).map(([key, label]) => (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={scope === key ? 'primary' : 'outline'}
                  onClick={() => setScope(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <p className="cb-dash-section-lead" data-testid="dashboard-section-lead">
            <span className="cb-dash-section-lead-title">O que precisa de atenção hoje</span>
            KPIs clicáveis abrem obrigações, documentos ou tarefas. Em baixo: filas operacionais e
            contexto do dia.
          </p>

          <div className="cb-dash-page" data-testid="firm-dashboard">
        {progress?.nextAction || (isFirmOwner && progress) ? (
          <details className="cb-dash-setup">
            <summary className="cb-dash-setup-summary">
              <span className="cb-dash-setup-summary-title">Primeiros passos do gabinete</span>
              <span className="cb-dash-setup-summary-hint">
                Configure página pública, Maya e activação — pode fechar quando terminar
              </span>
            </summary>
            <div className="cb-dash-setup-body">
              <FirmOnboardingWizard />
              {progress?.nextAction ? (
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                  <FirmNextStepCard
                    action={progress.nextAction}
                    loading={progressLoading}
                    isOwner={isFirmOwner}
                  />
                  <FirmPublicUrlCard publicUrl={progress.publicUrl} published={publicPublished} />
                </div>
              ) : null}
              {isFirmOwner && progress ? (
                <FirmActivationChecklist progress={progress} loading={progressLoading} isOwner={isFirmOwner} />
              ) : null}
            </div>
          </details>
        ) : (
          <FirmOnboardingWizard className="mb-4" />
        )}

        {loading && !data ? (
          <div className="cb-dash-kpi-row">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : null}

        {loadFailed ? (
          <EmptyState
            icon={AlertCircle}
            title="Não foi possível carregar o painel"
            description={
              getErrorMessage(dashboardQuery.error) ||
              'Verifique a ligação e tente novamente. Os seus dados estão seguros.'
            }
            action={
              <Button type="button" variant="primary" onClick={() => void dashboardQuery.refetch()}>
                Tentar novamente
              </Button>
            }
          />
        ) : null}

        {data ? (
          <>
            <section className="cb-dash-band" aria-labelledby="dash-precisa-si">
              <DashSectionHeading
                id="dash-precisa-si"
                title="Precisa da sua atenção"
                purpose="Números clicáveis: abrem obrigações, documentos ou tarefas filtrados pelo período escolhido."
              />
              <div className="cb-dash-kpi-row" data-testid="dashboard-kpi-strip">
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
              </div>
            </section>

            <div className="cb-dash-cols">
              <div className="cb-dash-col-main">
                <DashSectionHeading
                  id="dash-trabalho"
                  title="Trabalho por prioridade"
                  purpose="Listas operacionais: prazos críticos, atrasos e documentos à espera de validação."
                />
                <DashPanel
                  title="Prioridade 48h"
                  purpose="Obrigações que vencem nas próximas 48 horas — notifique os clientes se precisar."
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
                    pill={(o) =>
                      o.priority === 'URGENT'
                        ? { label: 'Urgente', className: 'cb-pill-orange' }
                        : { label: 'Crítico', className: 'cb-pill-red' }
                    }
                  />
                </DashPanel>

                <DashPanel
                  title="Obrigações em atraso"
                  purpose="Prazos já ultrapassados — trate primeiro estes clientes."
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
                  purpose="Ficheiros enviados pelos clientes que ainda precisam da sua revisão."
                  titleIcon={<Inbox className="h-3.5 w-3.5 text-orange-600" />}
                  linkLabel={`${kpiPendingDocs} por rever`}
                  linkTo="/app/firm/documents/files"
                >
                  {pendingDocsItems.length === 0 ? (
                    <EmptyState
                      className="border-0 bg-transparent py-8"
                      title="Fila de validação vazia"
                      description="Quando os clientes enviarem documentos, aparecem aqui para rever e validar."
                    />
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

              <aside className="cb-dash-col-aside" aria-labelledby="dash-hoje">
                <DashSectionHeading
                  id="dash-hoje"
                  title="Hoje no gabinete"
                  purpose="Saúde da carteira, agenda do dia, actividade recente e atalhos para o trabalho corrente."
                />
                <section className="cb-dash-panel">
                  <div className="cb-dash-panel-hd">
                    <div className="cb-dash-panel-hd-text">
                      <span className="cb-dash-panel-title">Estado da carteira</span>
                      <p className="cb-dash-panel-purpose">Clientes em dia, em atenção ou críticos.</p>
                    </div>
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
                      {portfolioTotal} empresas activas
                      {atRisk > 0 ? ` · ${atRisk} em risco` : ''}
                      {messagesUnread > 0 ? ` · ${messagesUnread} mensagens por ler` : ''}
                    </p>
                  </div>
                </section>

                <DashPanel
                  title="Agenda hoje"
                  purpose="Consultas e reuniões marcadas para hoje."
                  titleIcon={<Calendar className="h-3.5 w-3.5 text-sky-600" />}
                  linkLabel="ver agenda"
                  linkTo="/app/firm/agenda"
                >
                  {todayMeetings.length === 0 ? (
                    <EmptyState
                      className="border-0 bg-transparent py-8"
                      title="Sem reuniões hoje"
                      description="Marque uma consulta na agenda ou aguarde marcações da página pública."
                      action={
                        <Button type="button" size="sm" variant="outline" asChild>
                          <Link to="/app/firm/agenda">Abrir agenda</Link>
                        </Button>
                      }
                    />
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

                <DashPanel
                  title="Atividade recente"
                  purpose="Resumo rápido de prazos, documentos e reuniões recentes."
                  titleIcon={<Check className="h-3.5 w-3.5 text-muted-foreground" />}
                >
                  {activity.length === 0 ? (
                    <EmptyState
                      className="border-0 bg-transparent py-8"
                      title="Ainda sem movimento recente"
                      description="Quando houver prazos, documentos ou reuniões, o resumo aparece aqui."
                    />
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

                <section className="cb-dash-panel" aria-labelledby="dash-acoes">
                  <div className="cb-dash-panel-hd">
                    <div className="cb-dash-panel-hd-text">
                      <span id="dash-acoes" className="cb-dash-panel-title">
                        Acções rápidas
                      </span>
                      <p className="cb-dash-panel-purpose">Atalhos para o trabalho do dia.</p>
                    </div>
                  </div>
                  <div className="cb-dash-shortcuts">
                    {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
                      <Link key={to} to={to} className="cb-dash-sc">
                        <Icon className="h-3.5 w-3.5 text-brand" />
                        {label}
                      </Link>
                    ))}
                    <Link to="/app/firm/messages" className="cb-dash-sc">
                      <MessageSquare className="h-3.5 w-3.5 text-brand" />
                      Mensagens
                      {messagesUnread > 0 ? ` (${messagesUnread})` : ''}
                    </Link>
                    <Link to="/manual" className="cb-dash-sc">
                      <FileText className="h-3.5 w-3.5 text-brand" />
                      Manual
                    </Link>
                  </div>
                </section>

                <AgencyPromoCard />
              </aside>
            </div>
          </>
        ) : null}
          </div>
        </FirmModuleShell>
      </div>
      {isFirmOwner ? (
        <ClientsSpreadsheetDialog
          open={csvImportOpen}
          onOpenChange={setCsvImportOpen}
          onImported={() => {
            void dashboardQuery.refetch()
          }}
        />
      ) : null}
    </FirmScrollPage>
  )
}
