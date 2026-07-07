import { CalendarClock, Layers } from 'lucide-react'

import { AgendaAvailabilityPanel } from '@/features/firm/agenda/AgendaAvailabilityPanel'
import { AgendaServicesCatalogPanel } from '@/features/firm/agenda/AgendaServicesCatalogPanel'
import type { AccountingService, FirmBookingSettings } from '@/shared/types/contabil'

type Props = {
  services: AccountingService[]
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
          Defina dias de atendimento (incluindo fins de semana, se aplicável), horários e catálogo de
          serviços para marcações no portal do cliente.
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
            <h3 className="cb-agenda-settings-block-title">Catálogo de serviços</h3>
            <p className="cb-agenda-settings-block-sub">Tipos de consulta visíveis ao cliente no portal</p>
          </div>
        </div>
        <AgendaServicesCatalogPanel services={props.services} onReload={props.onReload} />
      </section>
    </div>
  )
}
