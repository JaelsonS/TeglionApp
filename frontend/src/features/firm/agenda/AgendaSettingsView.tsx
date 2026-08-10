import { ArrowRight, CalendarClock, CalendarDays, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AgendaAvailabilityPanel } from '@/features/firm/agenda/AgendaAvailabilityPanel'
import { GoogleCalendarIntegrationPanel } from '@/features/firm/agenda/GoogleCalendarIntegrationPanel'
import { Button } from '@/shared/components/ui/button'
import type { AccountingService, FirmBookingSettings } from '@/shared/types/contabil'

type Props = {
  services: AccountingService[]
  servicesLoading: boolean
  booking: FirmBookingSettings | null
  wd: number[]
  slotMin: number
  horizon: number
  bookingTz: string
  dayStart: string
  dayEnd: string
  onToggleWeekday: (n: number) => void
  onSlotMin: (n: number) => void
  onHorizon: (n: number) => void
  onBookingTz: (tz: string) => void
  onDayStart: (v: string) => void
  onDayEnd: (v: string) => void
  onSaveAvailability: () => void
  onReload: () => void | Promise<void>
}

export function AgendaSettingsView(props: Props) {
  return (
    <div className="cb-agenda-settings-view">
      <div className="cb-agenda-settings-intro">
        <h2 className="cb-agenda-settings-intro-title">Definições da agenda</h2>
        <p className="cb-agenda-settings-intro-sub">
          Configure aqui os serviços que o escritório presta — IRS, consultorias e outros —, os dias e
          horários em que aceita marcações, e a ligação ao Google Calendar.
        </p>
      </div>

      <section className="cb-agenda-settings-block">
        <div className="cb-agenda-settings-block-hd">
          <span className="cb-agenda-settings-block-icon">
            <CalendarClock className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="cb-agenda-settings-block-title">Disponibilidade</h3>
            <p className="cb-agenda-settings-block-sub">Dias e horário em que o escritório aceita marcações</p>
          </div>
        </div>
        <AgendaAvailabilityPanel
          booking={props.booking}
          wd={props.wd}
          slotMin={props.slotMin}
          horizon={props.horizon}
          bookingTz={props.bookingTz}
          dayStart={props.dayStart}
          dayEnd={props.dayEnd}
          onToggleWeekday={props.onToggleWeekday}
          onSlotMin={props.onSlotMin}
          onHorizon={props.onHorizon}
          onBookingTz={props.onBookingTz}
          onDayStart={props.onDayStart}
          onDayEnd={props.onDayEnd}
          onSaveAvailability={props.onSaveAvailability}
        />
      </section>

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

      <section className="cb-agenda-settings-block">
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
  )
}
