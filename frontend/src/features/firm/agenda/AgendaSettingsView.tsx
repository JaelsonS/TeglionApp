import { ArrowRight, CalendarClock, CalendarDays, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { AgendaAvailabilityPanel } from '@/features/firm/agenda/AgendaAvailabilityPanel'
import { AgendaServiceHoursPanel } from '@/features/firm/agenda/AgendaServiceHoursPanel'
import { GoogleCalendarIntegrationPanel } from '@/features/firm/agenda/GoogleCalendarIntegrationPanel'
import { contabilAccountingServicesApi, contabilConsultationsApi } from '@/infrastructure/api'
import { Button } from '@/shared/components/ui/button'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
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

  async function renameService(serviceId: string, name: string) {
    try {
      await contabilAccountingServicesApi.patch(serviceId, { name })
      await props.onReload()
      toast.success('Serviço renomeado.')
    } catch (err) {
      toast.error('Não foi possível renomear o serviço', { description: getErrorMessage(err) })
      throw err
    }
  }

  return (
    <div className="cb-agenda-settings-view">
      <nav className="cb-agenda-stepper" aria-label="Secções da agenda">
        <a className="cb-agenda-stepper-item cb-agenda-stepper-item-active" href="#agenda-horario-geral">
          <span className="cb-agenda-stepper-n">1</span>
          <span className="cb-agenda-stepper-label">
            Horário geral
            <span className="cb-agenda-stepper-ativo">Ativo</span>
          </span>
        </a>
        <span className="cb-agenda-stepper-line" aria-hidden />
        <a className="cb-agenda-stepper-item" href="#agenda-por-servico">
          <span className="cb-agenda-stepper-n">2</span>
          <span className="cb-agenda-stepper-label">Por serviço</span>
        </a>
        <span className="cb-agenda-stepper-line" aria-hidden />
        <a
          className="cb-agenda-stepper-item cb-agenda-stepper-item-later"
          href="#agenda-google"
          title="Integração Google Calendar — Fase 9"
        >
          <span className="cb-agenda-stepper-n">3</span>
          <span className="cb-agenda-stepper-label">
            Google Calendar
            <span className="cb-agenda-stepper-later">Mais tarde</span>
          </span>
        </a>
      </nav>

      <section id="agenda-horario-geral" className="scroll-mt-24">
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
          onRenameService={renameService}
        />
      </section>

      <section id="agenda-por-servico" className="cb-agenda-settings-block scroll-mt-24 mt-6">
        <div className="cb-agenda-settings-block-hd">
          <span className="cb-agenda-settings-block-icon">
            <CalendarClock className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="cb-agenda-settings-block-title">Disponibilidade por serviço</h3>
            <p className="cb-agenda-settings-block-sub">
              Defina a disponibilidade de cada serviço da sua agenda.
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

      <div className="cb-agenda-settings-lower mt-4">
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
                : 'Ainda não tem nenhum serviço configurado.'}
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
                <span className={cn('cb-agenda-stepper-later', 'ml-1 align-middle')}>Mais tarde</span>
              </h3>
              <p className="cb-agenda-settings-block-sub">
                Fase 9 — prepare staging antes de ligar a sincronização.
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
