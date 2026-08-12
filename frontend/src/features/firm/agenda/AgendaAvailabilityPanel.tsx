import type { FormChangeEvent } from '@/shared/types/react-events'
import { Clock, Globe, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { BOOKING_WEEKDAYS } from '@/features/firm/agenda/agendaCalendarUtils'
import type { BookingDateOverrides, BookingDaySchedule, FirmBookingSettings, TimeInterval } from '@/shared/types/contabil'
import { cn } from '@/shared/lib/utils'

const BOOKING_TIMEZONE_OPTIONS = [
  { value: 'Europe/Lisbon', label: 'Portugal continental' },
  { value: 'Atlantic/Azores', label: 'Açores' },
  { value: 'Europe/Madrid', label: 'Espanha (Madrid)' },
  { value: 'UTC', label: 'UTC' },
] as const

const DEFAULT_INTERVAL: TimeInterval = { start: '09:00', end: '17:00' }

type Props = {
  booking: FirmBookingSettings | null
  schedule: BookingDaySchedule
  onScheduleChange: (next: BookingDaySchedule) => void
  dateOverrides?: BookingDateOverrides
  onDateOverridesChange?: (next: BookingDateOverrides) => void
  slotMin: number
  horizon: number
  bookingTz: string
  onSlotMin: (n: number) => void
  onHorizon: (n: number) => void
  onBookingTz: (tz: string) => void
  onSaveAvailability: () => void
  hideSaveButton?: boolean
}

function intervalsForDay(schedule: BookingDaySchedule, day: number): TimeInterval[] {
  return schedule[day] || []
}

export function AgendaAvailabilityPanel(props: Props) {
  const {
    booking,
    schedule,
    onScheduleChange,
    dateOverrides = {},
    onDateOverridesChange,
    slotMin,
    horizon,
    bookingTz,
    onSlotMin,
    onHorizon,
    onBookingTz,
    onSaveAvailability,
    hideSaveButton,
  } = props

  const openDays = BOOKING_WEEKDAYS.filter((w) => intervalsForDay(schedule, w.bit).length > 0)
  const overrideDates = Object.keys(dateOverrides).sort()

  function setDayIntervals(day: number, intervals: TimeInterval[]) {
    const next: BookingDaySchedule = { ...schedule }
    if (!intervals.length) delete next[day]
    else next[day] = intervals
    onScheduleChange(next)
  }

  function toggleDay(day: number) {
    const current = intervalsForDay(schedule, day)
    if (current.length) setDayIntervals(day, [])
    else setDayIntervals(day, [{ ...DEFAULT_INTERVAL }])
  }

  function updateInterval(day: number, index: number, patch: Partial<TimeInterval>) {
    const current = [...intervalsForDay(schedule, day)]
    current[index] = { ...current[index], ...patch }
    setDayIntervals(day, current)
  }

  function addInterval(day: number) {
    const current = intervalsForDay(schedule, day)
    setDayIntervals(day, [...current, { start: '14:00', end: '17:00' }])
  }

  function removeInterval(day: number, index: number) {
    const current = intervalsForDay(schedule, day).filter((_, i) => i !== index)
    setDayIntervals(day, current)
  }

  function addDateOverride() {
    if (!onDateOverridesChange) return
    const d = new Date()
    d.setDate(d.getDate() + 1)
    const iso = d.toISOString().slice(0, 10)
    if (dateOverrides[iso] !== undefined) return
    onDateOverridesChange({ ...dateOverrides, [iso]: [] })
  }

  function setOverrideDateKey(oldKey: string, newKey: string) {
    if (!onDateOverridesChange || !newKey || oldKey === newKey) return
    const next = { ...dateOverrides }
    next[newKey] = next[oldKey] ?? []
    delete next[oldKey]
    onDateOverridesChange(next)
  }

  function setOverrideClosed(date: string, closed: boolean) {
    if (!onDateOverridesChange) return
    onDateOverridesChange({
      ...dateOverrides,
      [date]: closed ? [] : [{ ...DEFAULT_INTERVAL }],
    })
  }

  function updateOverrideInterval(date: string, index: number, patch: Partial<TimeInterval>) {
    if (!onDateOverridesChange) return
    const current = [...(dateOverrides[date] || [])]
    current[index] = { ...current[index], ...patch }
    onDateOverridesChange({ ...dateOverrides, [date]: current })
  }

  function addOverrideInterval(date: string) {
    if (!onDateOverridesChange) return
    const current = dateOverrides[date] || []
    onDateOverridesChange({
      ...dateOverrides,
      [date]: [...current, { start: '14:00', end: '17:00' }],
    })
  }

  function removeOverride(date: string) {
    if (!onDateOverridesChange) return
    const next = { ...dateOverrides }
    delete next[date]
    onDateOverridesChange(next)
  }

  return (
    <div className="cb-agenda-availability">
      <div>
        <p className="cb-agenda-availability-label">Horário de atendimento</p>
        <p className="cb-agenda-availability-hint">
          Defina os dias e um ou mais intervalos por dia (ex.: manhã e tarde), no estilo WhatsApp Business.
        </p>
        <div className="space-y-3">
          {BOOKING_WEEKDAYS.map((w) => {
            const intervals = intervalsForDay(schedule, w.bit)
            const open = intervals.length > 0
            return (
              <div
                key={w.bit}
                className={cn('rounded-xl border border-border/60 p-3', open ? 'bg-card' : 'bg-muted/20')}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleDay(w.bit)}
                    className={cn(
                      'rounded-full px-3 py-1 text-sm font-semibold',
                      open ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {w.full}
                  </button>
                  {open ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      onClick={() => addInterval(w.bit)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar intervalo
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Fechado</span>
                  )}
                </div>
                {open ? (
                  <ul className="mt-3 space-y-2">
                    {intervals.map((iv, idx) => (
                      <li key={`${w.bit}-${idx}`} className="flex flex-wrap items-center gap-2">
                        <Input
                          type="time"
                          className="h-9 w-[7.5rem] rounded-lg"
                          value={iv.start}
                          onChange={(e: FormChangeEvent) => updateInterval(w.bit, idx, { start: e.target.value })}
                        />
                        <span className="text-xs text-muted-foreground">até</span>
                        <Input
                          type="time"
                          className="h-9 w-[7.5rem] rounded-lg"
                          value={iv.end}
                          onChange={(e: FormChangeEvent) => updateInterval(w.bit, idx, { end: e.target.value })}
                        />
                        {intervals.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            aria-label="Remover intervalo"
                            onClick={() => removeInterval(w.bit, idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )
          })}
        </div>
        {openDays.length > 0 ? (
          <p className="cb-agenda-availability-selected mt-2">
            Selecionado: {openDays.map((w) => w.full).join(', ')}
          </p>
        ) : (
          <p className="cb-agenda-availability-warn">Seleccione pelo menos um dia.</p>
        )}
      </div>

      {onDateOverridesChange ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="cb-agenda-availability-label">Excepções por data</p>
              <p className="cb-agenda-availability-hint">
                Férias, feriados ou horário especial num dia concreto. Lista vazia = fechado.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={addDateOverride}>
              <Plus className="h-3.5 w-3.5" />
              Adicionar data
            </Button>
          </div>
          {overrideDates.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">Sem excepções — usa o horário semanal.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {overrideDates.map((date) => {
                const intervals = dateOverrides[date] || []
                const closed = intervals.length === 0
                return (
                  <li key={date} className="rounded-xl border border-border/60 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="date"
                        className="h-9 w-40 rounded-lg"
                        value={date}
                        onChange={(e: FormChangeEvent) => setOverrideDateKey(date, e.target.value)}
                      />
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={closed}
                          onChange={(e) => setOverrideClosed(date, e.target.checked)}
                        />
                        Fechado
                      </label>
                      {!closed ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => addOverrideInterval(date)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Intervalo
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-auto h-8 w-8 text-destructive"
                        aria-label="Remover excepção"
                        onClick={() => removeOverride(date)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {!closed ? (
                      <ul className="mt-2 space-y-2">
                        {intervals.map((iv, idx) => (
                          <li key={`${date}-${idx}`} className="flex flex-wrap items-center gap-2">
                            <Input
                              type="time"
                              className="h-9 w-[7.5rem] rounded-lg"
                              value={iv.start}
                              onChange={(e: FormChangeEvent) =>
                                updateOverrideInterval(date, idx, { start: e.target.value })
                              }
                            />
                            <span className="text-xs text-muted-foreground">até</span>
                            <Input
                              type="time"
                              className="h-9 w-[7.5rem] rounded-lg"
                              value={iv.end}
                              onChange={(e: FormChangeEvent) =>
                                updateOverrideInterval(date, idx, { end: e.target.value })
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}

      <div className="cb-agenda-availability-fields">
        <label className="cb-agenda-field">
          <span className="cb-agenda-field-label">
            <Globe className="h-3.5 w-3.5" aria-hidden />
            Fuso horário
          </span>
          <select className="cb-agenda-field-input" value={bookingTz} onChange={(e) => onBookingTz(e.target.value)}>
            {BOOKING_TIMEZONE_OPTIONS.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
        </label>
        <label className="cb-agenda-field">
          <span className="cb-agenda-field-label">Duração do slot</span>
          <select className="cb-agenda-field-input" value={slotMin} onChange={(e) => onSlotMin(Number(e.target.value))}>
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

      {hideSaveButton ? null : (
        <Button className="cb-agenda-save-btn" type="button" onClick={onSaveAvailability} disabled={openDays.length === 0}>
          Guardar disponibilidade
        </Button>
      )}

      {!hideSaveButton && booking ? (
        <p className="cb-agenda-availability-summary">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {booking.timezone || 'Europe/Lisbon'} · slots de {booking.slotMinutes} min · até {booking.horizonDays}{' '}
            dias · antecedência mín. {booking.leadTimeHours} h
          </span>
        </p>
      ) : null}
    </div>
  )
}
