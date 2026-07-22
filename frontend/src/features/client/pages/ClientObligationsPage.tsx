import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, MessageSquare } from 'lucide-react'

import { ClientAgendaCalendar } from '@/features/client/ClientAgendaCalendar'
import { ClientBookingPanel } from '@/features/client/ClientBookingPanel'
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
import { cn } from '@/shared/lib/utils'

type AgendaView = 'overview' | 'consultoria'

export function ClientObligationsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const locale = useMemo(
    () => (isContabilMode() ? 'pt-PT' : toClientHubLocale(getInitialAppLocale())),
    [],
  )
  const t = useMemo(() => getClientHubCopy(locale), [locale])
  const hubQuery = useClientPortalHub()
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)

  const view: AgendaView =
    searchParams.get('view') === 'consultoria' || searchParams.get('tab') === 'consultoria'
      ? 'consultoria'
      : 'overview'

  const setView = (next: AgendaView) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (next === 'consultoria') p.set('view', 'consultoria')
        else p.delete('view')
        p.delete('tab')
        return p
      },
      { replace: true },
    )
  }

  const agendaQuery = useQuery({
    queryKey: ['client-agenda-rich'],
    queryFn: async () => {
      const [obligationsRes, requestsRes, tasksRes] = await Promise.all([
        clientPortalContabilApi.listObligations() as Promise<{ items?: Obligation[] }>,
        clientPortalContabilApi.listDocumentRequests() as Promise<{ items?: DocumentRequest[] }>,
        clientPortalContabilApi.listTasks() as Promise<{ items?: ClientTask[] } | ClientTask[]>,
      ])
      const tasks = (Array.isArray(tasksRes) ? tasksRes : tasksRes.items ?? []).filter(
        (t) => t.taskType !== 'internal_task',
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
    (t) => t.taskType !== 'internal_task',
  )
  const requests = agendaQuery.data?.requests || []

  function openEvent(id: string) {
    if (id.startsWith('m-')) {
      setView('consultoria')
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
        subtitle="Prazos, o que enviar e consultoria com o escritório — num só sítio"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setView('overview')}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            view === 'overview'
              ? 'bg-brand text-primary-foreground'
              : 'border border-border bg-card text-foreground hover:bg-muted',
          )}
        >
          Visão geral
        </button>
        <button
          type="button"
          onClick={() => setView('consultoria')}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            view === 'consultoria'
              ? 'bg-brand text-primary-foreground'
              : 'border border-border bg-card text-foreground hover:bg-muted',
          )}
        >
          Consultoria
        </button>
        <Button
          type="button"
          variant="ghost"
          className="rounded-full"
          onClick={() => navigate('/app/client/messages')}
        >
          <MessageSquare className="mr-1.5 h-4 w-4" aria-hidden />
          Escrever ao escritório
        </Button>
      </div>

      {view === 'consultoria' ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Escolha um horário que lhe dê jeito. Se preferir, pode{' '}
            <button
              type="button"
              className="font-semibold text-brand hover:underline"
              onClick={() => navigate('/app/client/messages')}
            >
              escrever primeiro
            </button>
            .
          </p>
          <ClientBookingPanel t={t} />
        </div>
      ) : (
        <>
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

          <div className="rounded-2xl border border-dashed border-border/80 bg-card/60 px-4 py-4 text-center sm:text-left">
            <p className="text-sm font-medium text-foreground">Quer falar com alguém do escritório?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Marque uma consultoria ou envie uma mensagem — o que for mais simples agora.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Button type="button" className="rounded-full" onClick={() => setView('consultoria')}>
                <CalendarCheck className="mr-1.5 h-4 w-4" aria-hidden />
                Marcar consultoria
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => navigate('/app/client/messages')}
              >
                <MessageSquare className="mr-1.5 h-4 w-4" aria-hidden />
                Enviar mensagem
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
