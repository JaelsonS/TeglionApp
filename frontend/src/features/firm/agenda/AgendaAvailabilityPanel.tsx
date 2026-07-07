import type { FormChangeEvent } from '@/shared/types/react-events'
import { Clock, Globe } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { BOOKING_WEEKDAYS } from '@/features/firm/agenda/agendaCalendarUtils'
import type { FirmBookingSettings } from '@/shared/types/contabil'
import { cn } from '@/shared/lib/utils'

const BOOKING_TIMEZONE_OPTIONS = [
  { value: 'Europe/Lisbon', label: 'Portugal continental' },
  { value: 'Atlantic/Azores', label: 'Açores' },
  { value: 'Europe/Madrid', label: 'Espanha (Madrid)' },
  { value: 'UTC', label: 'UTC' },
] as const

type Props = {
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
}

export function AgendaAvailabilityPanel(props: Props) {
  const {
    booking,
    wd,
    slotMin,
    horizon,
    bookingTz,
    dayStart,
    dayEnd,
    onToggleWeekday,
    onSlotMin,
    onHorizon,
    onBookingTz,
    onDayStart,
    onDayEnd,
    onSaveAvailability,
  } = props

  const selectedLabels = BOOKING_WEEKDAYS.filter((w) => wd.includes(w.bit)).map((w) => w.full)

  return (
    <div className="cb-agenda-availability">
      <div>
        <p className="cb-agenda-availability-label">Dias de atendimento</p>
        <p className="cb-agenda-availability-hint">
          Segunda a domingo — active apenas os dias em que o escritório agenda consultas (inclua sábado ou
          domingo se trabalhar nesses dias).
        </p>
        <div className="cb-agenda-weekday-grid">
          {BOOKING_WEEKDAYS.map((w) => (
            <button
              key={w.bit}
              type="button"
              title={w.full}
              onClick={() => onToggleWeekday(w.bit)}
              className={cn(
                'cb-agenda-weekday-btn',
                wd.includes(w.bit) && 'cb-agenda-weekday-btn-active',
              )}
            >
              <span className="cb-agenda-weekday-short">{w.label}</span>
              <span className="cb-agenda-weekday-full">{w.full}</span>
            </button>
          ))}
        </div>
        {selectedLabels.length > 0 ? (
          <p className="cb-agenda-availability-selected">
            Selecionado: {selectedLabels.join(', ')}
          </p>
        ) : (
          <p className="cb-agenda-availability-warn">Seleccione pelo menos um dia.</p>
        )}
      </div>

      <div className="cb-agenda-availability-fields">
        <label className="cb-agenda-field">
          <span className="cb-agenda-field-label">
            <Globe className="h-3.5 w-3.5" aria-hidden />
            Fuso horário
          </span>
          <select
            className="cb-agenda-field-input"
            value={bookingTz}
            onChange={(e) => onBookingTz(e.target.value)}
          >
            {BOOKING_TIMEZONE_OPTIONS.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
        </label>
        <label className="cb-agenda-field">
          <span className="cb-agenda-field-label">Início do expediente</span>
          <Input type="time" className="cb-agenda-field-input" value={dayStart} onChange={(e: FormChangeEvent) => onDayStart(e.target.value)} />
        </label>
        <label className="cb-agenda-field">
          <span className="cb-agenda-field-label">Fim do expediente</span>
          <Input type="time" className="cb-agenda-field-input" value={dayEnd} onChange={(e: FormChangeEvent) => onDayEnd(e.target.value)} />
        </label>
        <label className="cb-agenda-field">
          <span className="cb-agenda-field-label">Duração do slot</span>
          <select
            className="cb-agenda-field-input"
            value={slotMin}
            onChange={(e) => onSlotMin(Number(e.target.value))}
          >
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={45}>45 min</option>
            <option value={60}>60 min</option>
          </select>
        </label>
        <label className="cb-agenda-field">
          <span className="cb-agenda-field-label">Horizonte (dias à frente)</span>
          <Input
            type="number"
            min={1}
            max={60}
            className="cb-agenda-field-input"
            value={horizon}
            onChange={(e: FormChangeEvent) => onHorizon(Number(e.target.value))}
          />
        </label>
      </div>

      <Button className="cb-agenda-save-btn" type="button" onClick={onSaveAvailability} disabled={wd.length === 0}>
        Guardar disponibilidade
      </Button>

      {booking ? (
        <p className="cb-agenda-availability-summary">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {booking.timezone || 'Europe/Lisbon'} · slots de {booking.slotMinutes} min · até{' '}
            {booking.horizonDays} dias · antecedência mín. {booking.leadTimeHours} h
          </span>
        </p>
      ) : null}
    </div>
  )
}
