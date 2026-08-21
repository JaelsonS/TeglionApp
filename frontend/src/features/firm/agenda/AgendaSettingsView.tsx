import { ArrowRight, CalendarClock, CalendarDays, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { AgendaAvailabilityPanel } from '@/features/firm/agenda/AgendaAvailabilityPanel'
import { AgendaServiceHoursPanel } from '@/features/firm/agenda/AgendaServiceHoursPanel'
import { GoogleCalendarIntegrationPanel } from '@/features/firm/agenda/GoogleCalendarIntegrationPanel'
import { contabilAccountingServicesApi, contabilConsultationsApi } from '@/infrastructure/api'
import { Button } from '@/shared/components/ui/button'
import { getErrorMessage } from '@/shared/utils/errors'
import type {
  AccountingService,
  BookingDateOverrides,
  BookingDaySchedule,
  FirmBookingSettings,
} from '@/shared/types/contabil'

type Props = {
  services: AccountingService[]
  servicesLoading: boolean
  booking: FirmBookingSettings | null
  schedule: BookingDaySchedule
  dateOverrides: NonNullable<FirmBookingSettings['dateOverrides']>
  slotMin: number
  horizon: number
  bookingTz: string
  onScheduleChange: (next: BookingDaySchedule) => void
  onDateOverridesChange: (next: NonNullable<FirmBookingSettings['dateOverrides']>) => void
  onSlotMin: (n: number) => void
  onHorizon: (n: number) => void
  onBookingTz: (tz: string) => void
  onSaveAvailability: () => void
  onReload: () => void | Promise<void>
}

export function AgendaSettingsView(props: Props) {
  const bookable = props.services.filter((s) => s.isActive !== false && s.requiresBooking)

  async function persistDay(payload: {
    date: string
    dateOverrides: BookingDateOverrides
    servicePatches: Array<{ id: string; bookingOverrides: Partial<FirmBookingSettings> | null }>
  }) {
    const openDays = Object.keys(props.schedule)
      .map(Number)
      .filter((d) => (props.schedule[d] || []).length > 0)

    try {
      const res = (await contabilConsultationsApi.patchBookingSettings({
        slotMinutes: props.slotMin,
        horizonDays: props.horizon,
        schedule: props.schedule,
        dateOverrides: payload.dateOverrides || {},
        weekdays: openDays.sort((a, b) => a - b),
        leadTimeHours: props.booking?.leadTimeHours ?? 2,
        timezone: props.bookingTz,
      })) as { booking?: FirmBookingSettings }

      if (res.booking?.dateOverrides) {
        props.onDateOverridesChange(res.booking.dateOverrides)
      } else {
        props.onDateOverridesChange(payload.dateOverrides)
      }

      for (const patch of payload.servicePatches) {
        await contabilAccountingServicesApi.patch(patch.id, {
          bookingOverrides: patch.bookingOverrides,
        })
      }

      if (payload.servicePatches.length) {
        await props.onReload()
      }

      toast.success(
        payload.servicePatches.length
          ? `Dia ${payload.date} guardado (escritório + ${payload.servicePatches.length} serviço(s)).`
          : `Dia ${payload.date} guardado no horário do escritório.`,
      )
    } catch (err) {
      toast.error('Não foi possível guardar o dia', { description: getErrorMessage(err) })
      throw err
    }
  }

  return (
    <div className="cb-agenda-settings-view">
      <nav className="cb-agenda-settings-steps" aria-label="Secções da agenda">
        <a className="cb-agenda-settings-step cb-agenda-settings-step-active" href="#agenda-horario-geral">
          <span className="cb-agenda-settings-step-n">1</span>
          <span>
            Horário geral
            <span className="cb-agenda-settings-step-badge ml-0 block sm:ml-2 sm:inline">Ativo</span>
          </span>
        </a>
        <a className="cb-agenda-settings-step" href="#agenda-por-servico">
          <span className="cb-agenda-settings-step-n">2</span>
          Por serviço
        </a>
        <a
          className="cb-agenda-settings-step cb-agenda-settings-step-later"
          href="#agenda-google"
          title="Integração Google Calendar fica para o final do roadmap (Fase 9)"
        >
          <span className="cb-agenda-settings-step-n">3</span>
          <span>
            Google Calendar
            <span className="cb-agenda-settings-step-later-badge ml-0 mt-0.5 block sm:ml-2 sm:mt-0 sm:inline">
              Mais tarde
            </span>
          </span>
        </a>
      </nav>

      <section
        id="agenda-horario-geral"
        className="cb-agenda-settings-block scroll-mt-24 !border-0 !bg-transparent !p-0 !shadow-none"
      >
        <div className="mb-4">
          <h3 className="cb-agenda-settings-block-title text-base">Horário geral do escritório</h3>
          <p className="cb-agenda-settings-block-sub mt-1 max-w-2xl">
            Defina a disponibilidade da organização. O horário semanal é a predefinição; as excepções do mês
            sobrescrevem dias concretos. No dialog do dia pode ajustar serviços com persistência real.
          </p>
        </div>
        <AgendaAvailabilityPanel
          booking={props.booking}
          schedule={props.schedule}
          onScheduleChange={props.onScheduleChange}
          dateOverrides={props.dateOverrides}
          onDateOverridesChange={props.onDateOverridesChange}
          slotMin={props.slotMin}
          horizon={props.horizon}
          bookingTz={props.bookingTz}
          onSlotMin={props.onSlotMin}
          onHorizon={props.onHorizon}
          onBookingTz={props.onBookingTz}
          onSaveAvailability={props.onSaveAvailability}
          bookableServices={bookable}
          onPersistDay={persistDay}
        />
      </section>

      <section id="agenda-por-servico" className="cb-agenda-settings-block scroll-mt-24">
        <div className="cb-agenda-settings-block-hd">
          <span className="cb-agenda-settings-block-icon">
            <CalendarClock className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="cb-agenda-settings-block-title">Disponibilidade por serviço</h3>
            <p className="cb-agenda-settings-block-sub">
              Quais os dias e intervalos em que cada serviço pode ser agendado
            </p>
          </div>
        </div>
        <AgendaServiceHoursPanel
          services={props.services}
          servicesLoading={props.servicesLoading}
          onReload={props.onReload}
          firmSchedule={props.schedule}
        />
      </section>

      <div className="cb-agenda-settings-lower">
        <section className="cb-agenda-settings-block">
          <div className="cb-agenda-settings-block-hd">
            <span className="cb-agenda-settings-block-icon">
              <Layers className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3 className="cb-agenda-settings-block-title">Serviços do escritório</h3>
              <p className="cb-agenda-settings-block-sub">
                Crie, edite e publique cada serviço na página pública
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">
              {props.services.length > 0
                ? `${props.services.filter((s) => s.isActive !== false).length} de ${props.services.length} serviço(s) activo(s).`
                : 'Ainda não tem nenhum serviço configurado.'}{' '}
              Catálogo em Serviços.
            </p>
            <Link to="/app/firm/services">
              <Button type="button" size="sm" className="rounded-full">
                Ir para Serviços <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </section>

        <section id="agenda-google" className="cb-agenda-settings-block cb-agenda-gcal-deferred scroll-mt-24">
          <div className="cb-agenda-settings-block-hd">
            <span className="cb-agenda-settings-block-icon">
              <CalendarDays className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3 className="cb-agenda-settings-block-title">
                Google Calendar{' '}
                <span className="cb-agenda-settings-step-later-badge ml-1 align-middle">Mais tarde</span>
              </h3>
              <p className="cb-agenda-settings-block-sub">
                Fase 9 do roadmap — prepare o ambiente de staging antes de ligar a sincronização.
              </p>
            </div>
          </div>
          <div className="opacity-70">
            <GoogleCalendarIntegrationPanel />
          </div>
        </section>
      </div>
    </div>
  )
}
