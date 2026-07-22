import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, MessageSquare } from 'lucide-react'

import { ClientAgendaCalendar } from '@/features/client/ClientAgendaCalendar'
import { ClientObligationsView } from '@/features/client/views/ClientObligationsView'
import { getClientHubCopy, toClientHubLocale } from '@/features/client/clientHubI18n'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'
import { Button } from '@/shared/components/ui/button'
import { isContabilMode } from '@/shared/config/productMode'
import { clientPortalContabilApi } from '@/infrastructure/api'
import { useClientPortalHub } from '@/shared/hooks/queries/useClientPortalHub'
import { getInitialAppLocale } from '@/shared/i18n/appLocale'
import type { Obligation } from '@/shared/types/contabil'

export function ClientObligationsPage() {
  const navigate = useNavigate()
  const locale = useMemo(
    () => (isContabilMode() ? 'pt-PT' : toClientHubLocale(getInitialAppLocale())),
    [],
  )
  const t = useMemo(() => getClientHubCopy(locale), [locale])
  const hubQuery = useClientPortalHub()
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)

  const obligationsQuery = useQuery({
    queryKey: ['client-agenda-fiscal-calendar'],
    queryFn: async () => {
      const res = (await clientPortalContabilApi.listObligations()) as { items?: Obligation[] }
      return res.items ?? []
    },
    staleTime: 60_000,
  })

  return (
    <div className="space-y-5" data-testid="client-obligations-page">
      <PageHeader
        title="Agenda"
        subtitle="Calendário de obrigações, prazos e reuniões marcadas com o escritório"
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="rounded-full"
          onClick={() => navigate('/app/client/messages')}
        >
          <MessageSquare className="mr-1.5 h-4 w-4" aria-hidden />
          Mensagem ao escritório
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => navigate('/app/client/booking')}
        >
          <CalendarCheck className="mr-1.5 h-4 w-4" aria-hidden />
          Agendar reunião
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <ClientAgendaCalendar
          obligations={obligationsQuery.data || []}
          consultations={hubQuery.data?.upcomingConsultations || []}
          selectedDateKey={selectedDateKey}
          onSelectDate={setSelectedDateKey}
          onOpenObligation={(id) => {
            if (id.startsWith('m-')) {
              navigate('/app/client/booking')
              return
            }
            navigate(`/app/client/agenda?obligation=${encodeURIComponent(id)}`)
          }}
        />
        <div className="min-w-0">
          <ClientObligationsView t={t} filterDateKey={selectedDateKey} />
        </div>
      </div>
    </div>
  )
}
