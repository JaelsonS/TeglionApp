import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare } from 'lucide-react'

import { ClientAgendaCalendar } from '@/features/client/ClientAgendaCalendar'
import { ClientSendThisMonth } from '@/features/client/ClientSendThisMonth'
import { ClientObligationsView } from '@/features/client/views/ClientObligationsView'
import { getClientHubCopy, toClientHubLocale } from '@/features/client/clientHubI18n'
import { AskMayaButton } from '@/features/maya'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/design-system'
import { isContabilMode } from '@/shared/config/productMode'
import { clientPortalContabilApi } from '@/infrastructure/api'
import { useClientPortalHub } from '@/shared/hooks/queries/useClientPortalHub'
import { useAuth } from '@/shared/hooks/useAuth'
import { getInitialAppLocale } from '@/shared/i18n/appLocale'
import type { ClientTask, DocumentRequest, Obligation } from '@/shared/types/contabil'

export function ClientObligationsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const clientId = user?.clientId || user?.id || ''
  const [searchParams] = useSearchParams()
  const locale = useMemo(
    () => (isContabilMode() ? 'pt-PT' : toClientHubLocale(getInitialAppLocale())),
    [],
  )
  const t = useMemo(() => getClientHubCopy(locale), [locale])
  const hubQuery = useClientPortalHub()
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const redirectToServices =
    searchParams.get('view') === 'consultoria' || searchParams.get('tab') === 'consultoria'

  const agendaQuery = useQuery({
    queryKey: ['client-agenda-rich', clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      const [obligationsRes, requestsRes, tasksRes] = await Promise.all([
        clientPortalContabilApi.listObligations() as Promise<{ items?: Obligation[] }>,
        clientPortalContabilApi.listDocumentRequests() as Promise<{ items?: DocumentRequest[] }>,
        clientPortalContabilApi.listTasks() as Promise<{ items?: ClientTask[] } | ClientTask[]>,
      ])
      const tasks = (Array.isArray(tasksRes) ? tasksRes : tasksRes.items ?? []).filter(
        (item) => item.taskType !== 'internal_task',
      )
      return {
        obligations: obligationsRes.items ?? [],
        requests: requestsRes.items ?? [],
        tasks,
      }
    },
    staleTime: 45_000,
    refetchInterval: 60_000,
  })

  const obligations = agendaQuery.data?.obligations || hubQuery.data?.obligations || []
  const tasks = (agendaQuery.data?.tasks || hubQuery.data?.tasks || []).filter(
    (item) => item.taskType !== 'internal_task',
  )
  const requests = agendaQuery.data?.requests || []

  if (redirectToServices) {
    return <Navigate to="/app/client/services" replace />
  }

  function openEvent(id: string) {
    if (id.startsWith('m-')) {
      navigate('/app/client/services')
      return
    }
    if (id.startsWith('req-')) {
      navigate(`/app/client/requests?request=${encodeURIComponent(id.slice(4))}`)
      return
    }
    if (id.startsWith('task-')) {
      navigate('/app/client/documents')
      return
    }
    navigate(`/app/client/agenda?obligation=${encodeURIComponent(id)}`)
  }

  return (
    <div className="space-y-5" data-testid="client-obligations-page">
      <PageHeader
        title="Prazos"
        subtitle="Agrupados: em atraso, esta semana, mais tarde. A data completa fica no detalhe."
        actions={<AskMayaButton intentId="portal-deadlines" />}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => navigate('/app/client/messages')}
        >
          <MessageSquare className="mr-1.5 h-4 w-4" aria-hidden />
          Escrever ao escritório
        </Button>
        <Button type="button" variant="ghost" className="rounded-full" onClick={() => navigate('/app/client/services')}>
          Pedir um serviço
        </Button>
      </div>

      {agendaQuery.isLoading ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : (
        <ClientSendThisMonth requests={requests} tasks={tasks} obligations={obligations} />
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="hidden min-w-0 xl:block">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Calendário</p>
          <ClientAgendaCalendar
            obligations={obligations}
            consultations={hubQuery.data?.upcomingConsultations || []}
            tasks={tasks}
            requests={requests}
            selectedDateKey={selectedDateKey}
            onSelectDate={setSelectedDateKey}
            onOpenEvent={(id) => openEvent(id)}
          />
        </div>
        <div className="min-w-0">
          <ClientObligationsView t={t} filterDateKey={selectedDateKey} obligations={obligations} />
        </div>
      </div>
    </div>
  )
}
