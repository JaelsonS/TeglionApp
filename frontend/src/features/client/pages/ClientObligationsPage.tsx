import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, MessageSquare } from 'lucide-react'

import { ClientAgendaCalendar } from '@/features/client/ClientAgendaCalendar'
import { ClientSendThisMonth } from '@/features/client/ClientSendThisMonth'
import { ClientObligationsView } from '@/features/client/views/ClientObligationsView'
import { getClientHubCopy, toClientHubLocale } from '@/features/client/clientHubI18n'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/design-system'
import { isContabilMode } from '@/shared/config/productMode'
import { clientPortalContabilApi } from '@/infrastructure/api'
import { useClientPortalHub } from '@/shared/hooks/queries/useClientPortalHub'
import { getInitialAppLocale } from '@/shared/i18n/appLocale'
import type { ClientTask, DocumentRequest, Obligation } from '@/shared/types/contabil'

export function ClientObligationsPage() {
  const navigate = useNavigate()
  const locale = useMemo(
    () => (isContabilMode() ? 'pt-PT' : toClientHubLocale(getInitialAppLocale())),
    [],
  )
  const t = useMemo(() => getClientHubCopy(locale), [locale])
  const hubQuery = useClientPortalHub()
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)

  const agendaQuery = useQuery({
    queryKey: ['client-agenda-rich'],
    queryFn: async () => {
      const [obligationsRes, requestsRes, tasksRes] = await Promise.all([
        clientPortalContabilApi.listObligations() as Promise<{ items?: Obligation[] }>,
        clientPortalContabilApi.listDocumentRequests() as Promise<{ items?: DocumentRequest[] }>,
        clientPortalContabilApi.listTasks() as Promise<{ items?: ClientTask[] } | ClientTask[]>,
      ])
      const tasks = Array.isArray(tasksRes) ? tasksRes : tasksRes.items ?? []
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
  const tasks = agendaQuery.data?.tasks || hubQuery.data?.tasks || []
  const requests = agendaQuery.data?.requests || []

  function openEvent(id: string) {
    if (id.startsWith('m-')) {
      navigate('/app/client/booking')
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
        title="Agenda"
        subtitle="O que enviar este mês, calendário de pedidos, tarefas e reuniões com o escritório"
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" className="rounded-full" onClick={() => navigate('/app/client/messages')}>
          <MessageSquare className="mr-1.5 h-4 w-4" aria-hidden />
          Mensagem ao escritório
        </Button>
        <Button type="button" variant="outline" className="rounded-full" onClick={() => navigate('/app/client/booking')}>
          <CalendarCheck className="mr-1.5 h-4 w-4" aria-hidden />
          Consultoria
        </Button>
      </div>

      {agendaQuery.isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (
        <ClientSendThisMonth requests={requests} tasks={tasks} obligations={obligations} />
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <ClientAgendaCalendar
          obligations={obligations}
          consultations={hubQuery.data?.upcomingConsultations || []}
          tasks={tasks}
          requests={requests}
          selectedDateKey={selectedDateKey}
          onSelectDate={setSelectedDateKey}
          onOpenEvent={(id) => openEvent(id)}
        />
        <div className="min-w-0">
          <ClientObligationsView t={t} filterDateKey={selectedDateKey} />
        </div>
      </div>
    </div>
  )
}
