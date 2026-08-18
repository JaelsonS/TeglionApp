import { ArrowRight, CalendarClock, CalendarDays, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AgendaAvailabilityPanel } from '@/features/firm/agenda/AgendaAvailabilityPanel'
import { AgendaServiceHoursPanel } from '@/features/firm/agenda/AgendaServiceHoursPanel'
import { GoogleCalendarIntegrationPanel } from '@/features/firm/agenda/GoogleCalendarIntegrationPanel'
import { Button } from '@/shared/components/ui/button'
import type { AccountingService, BookingDaySchedule, FirmBookingSettings } from '@/shared/types/contabil'

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
  return (
    <div className="cb-agenda-settings-view">
      <nav className="cb-agenda-settings-steps" aria-label="Secções da agenda">
        <a className="cb-agenda-settings-step" href="#agenda-horario-geral">
          <span className="cb-agenda-settings-step-n">1</span>
          Horário geral
        </a>
        <a className="cb-agenda-settings-step" href="#agenda-por-servico">
          <span className="cb-agenda-settings-step-n">2</span>
          Por serviço
        </a>
        <a className="cb-agenda-settings-step" href="#agenda-google">
          <span className="cb-agenda-settings-step-n">3</span>
          Google Calendar
        </a>
      </nav>

      <section id="agenda-horario-geral" className="cb-agenda-settings-block scroll-mt-24">
        <div className="cb-agenda-settings-block-hd">
          <span className="cb-agenda-settings-block-icon">
            <CalendarClock className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="cb-agenda-settings-block-title">Horário geral do escritório</h3>
            <p className="cb-agenda-settings-block-sub">
              Predefinição para todos os serviços. Uma marcação tranca esse horário no calendário partilhado
              (incluindo o Google, quando ligado).
            </p>
          </div>
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
        />
      </section>

      <div className="cb-agenda-settings-lower">
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

      <div className="cb-agenda-settings-lower-side">
      <section className="cb-agenda-settings-block">
        <div className="cb-agenda-settings-block-hd">
          <span className="cb-agenda-settings-block-icon">
            <Layers className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="cb-agenda-settings-block-title">Serviços do escritório</h3>
            <p className="cb-agenda-settings-block-sub">
              IRS, consultorias e outros — crie, configure e publique cada um na página pública
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/10 p-4">
          <p className="text-sm text-muted-foreground">
            {props.services.length > 0
              ? `${props.services.filter((s) => s.isActive !== false).length} de ${props.services.length} serviço(s) activo(s).`
              : 'Ainda não tem nenhum serviço configurado.'}{' '}
            Crie, edite e publique em Serviços → Catálogo.
          </p>
          <Link to="/app/firm/services">
            <Button type="button" size="sm" className="rounded-full">
              Ir para Serviços <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </section>

      <section id="agenda-google" className="cb-agenda-settings-block scroll-mt-24">
        <div className="cb-agenda-settings-block-hd">
          <span className="cb-agenda-settings-block-icon">
            <CalendarDays className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="cb-agenda-settings-block-title">Google Calendar</h3>
            <p className="cb-agenda-settings-block-sub">Sincronize as suas marcações com a sua conta Google</p>
          </div>
        </div>
        <GoogleCalendarIntegrationPanel />
      </section>
      </div>
      </div>
    </div>
  )
}
