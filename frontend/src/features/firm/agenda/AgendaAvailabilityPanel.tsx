import { useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Clock, Globe, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { DurationMinutesField } from '@/shared/design-system'
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
  /** false = só dias e intervalos (override por serviço). Omissão: mostra fuso/slot/horizonte. */
  showSlotSettings?: boolean
  /** Intervalo usado ao reabrir um dia fechado. Omissão: 09:00–17:00. */
  defaultInterval?: TimeInterval
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
    showSlotSettings = true,
    defaultInterval = DEFAULT_INTERVAL,
  } = props

  const openDays = BOOKING_WEEKDAYS.filter((w) => intervalsForDay(schedule, w.bit).length > 0)
  const overrideDates = Object.keys(dateOverrides).sort()
  const [copySource, setCopySource] = useState<number>(1)
  const [copyTargets, setCopyTargets] = useState<number[]>([])
  const [focusedDay, setFocusedDay] = useState<number>(1)
  const focusedWeekday = BOOKING_WEEKDAYS.find((w) => w.bit === focusedDay) ?? BOOKING_WEEKDAYS[0]
  const focusedIntervals = intervalsForDay(schedule, focusedWeekday.bit)
  const focusedOpen = focusedIntervals.length > 0

  function copyIntervalsToDays() {
    const source = intervalsForDay(schedule, copySource).map((iv) => ({ ...iv }))
    if (!source.length || copyTargets.length === 0) return
    const next: BookingDaySchedule = { ...schedule }
    for (const day of copyTargets) {
      next[day] = source.map((iv) => ({ ...iv }))
    }
    onScheduleChange(next)
    setCopyTargets([])
  }

  function setDayIntervals(day: number, intervals: TimeInterval[]) {
    const next: BookingDaySchedule = { ...schedule }
    if (!intervals.length) delete next[day]
    else next[day] = intervals
    onScheduleChange(next)
  }

  function toggleDay(day: number) {
    const current = intervalsForDay(schedule, day)
    if (current.length) setDayIntervals(day, [])
    else {
      setDayIntervals(day, [{ ...defaultInterval }])
      setFocusedDay(day)
    }
  }

  function selectDay(day: number) {
    setFocusedDay(day)
    if (intervalsForDay(schedule, day).length === 0) {
      setDayIntervals(day, [{ ...defaultInterval }])
    }
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

  const slotAndSave = (
    <>
      {showSlotSettings ? (
        <div className="cb-agenda-availability-fields">
          <p className="cb-agenda-availability-aside-title">Opções de marcação</p>
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
            <DurationMinutesField
              value={slotMin}
              onChange={onSlotMin}
              min={5}
              max={240}
              presets={[15, 30, 45, 60, 90, 120]}
              inputClassName="cb-agenda-field-input"
              aria-label="Duração do slot em minutos"
            />
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
      ) : null}

      {hideSaveButton ? null : (
        <Button
          className="cb-agenda-save-btn w-full"
          type="button"
          onClick={onSaveAvailability}
          disabled={openDays.length === 0}
        >
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
    </>
  )

  return (
    <div className={cn('cb-agenda-availability', showSlotSettings && 'cb-agenda-availability-layout')}>
      <div className="space-y-5">
      <div>
        <p className="cb-agenda-availability-label">Horário de atendimento</p>
        <p className="cb-agenda-availability-hint">
          Clique num dia para o abrir e editar. Pode copiar o horário para os outros dias.
        </p>
        <div className="cb-agenda-weekday-grid" role="group" aria-label="Dias da semana">
          {BOOKING_WEEKDAYS.map((w) => {
            const open = intervalsForDay(schedule, w.bit).length > 0
            return (
              <button
                key={`strip-${w.bit}`}
                type="button"
                className={cn(
                  'cb-agenda-weekday-btn',
                  open && 'cb-agenda-weekday-btn-active',
                  focusedDay === w.bit && 'cb-agenda-weekday-btn-focus',
                )}
                aria-current={focusedDay === w.bit ? 'true' : undefined}
                aria-label={open ? `Ver horário de ${w.full}` : `${w.full} indisponível`}
                onClick={() => selectDay(w.bit)}
              >
                <span className="cb-agenda-weekday-short">{w.label}</span>
                <span className="cb-agenda-weekday-full">{w.label}</span>
                {!open ? <span className="cb-agenda-weekday-closed">Fechado</span> : null}
              </button>
            )
          })}
        </div>
        <div className="cb-agenda-day-editor" id={`agenda-day-${focusedWeekday.bit}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => toggleDay(focusedWeekday.bit)}
              aria-pressed={focusedOpen}
              aria-label={
                focusedOpen ? `${focusedWeekday.full} disponível` : `${focusedWeekday.full} indisponível`
              }
              className={cn(
                'rounded-full px-3 py-1 text-sm font-semibold',
                focusedOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground',
              )}
            >
              {focusedWeekday.full}
            </button>
            {focusedOpen ? (
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => addInterval(focusedWeekday.bit)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar intervalo
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={() => toggleDay(focusedWeekday.bit)}
                >
                  Fechar este dia
                </Button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Fechado — clique no nome para abrir</span>
            )}
          </div>
          {focusedOpen ? (
            <ul className="mt-3 space-y-2">
              {focusedIntervals.map((iv, idx) => (
                <li key={`${focusedWeekday.bit}-${idx}`} className="flex flex-wrap items-center gap-2">
                  <Input
                    type="time"
                    className="h-9 w-[7.5rem] rounded-lg"
                    value={iv.start}
                    onChange={(e: FormChangeEvent) =>
                      updateInterval(focusedWeekday.bit, idx, { start: e.target.value })
                    }
                  />
                  <span className="text-xs text-muted-foreground">até</span>
                  <Input
                    type="time"
                    className="h-9 w-[7.5rem] rounded-lg"
                    value={iv.end}
                    onChange={(e: FormChangeEvent) =>
                      updateInterval(focusedWeekday.bit, idx, { end: e.target.value })
                    }
                  />
                  {focusedIntervals.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      aria-label="Remover intervalo"
                      onClick={() => removeInterval(focusedWeekday.bit, idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {openDays.length > 0 ? (
          <div className="mt-3 space-y-2 rounded-xl border border-border/50 bg-muted/10 p-3">
            <p className="cb-agenda-availability-selected">
              Aberto: {openDays.map((w) => w.label).join(', ')}
            </p>
            <p className="text-xs font-medium text-foreground">Copiar horário</p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[11px] text-muted-foreground">
                De{' '}
                <select
                  className="ml-1 h-8 rounded-md border border-input bg-background px-2 text-xs"
                  value={copySource}
                  onChange={(e) => setCopySource(Number(e.target.value))}
                >
                  {BOOKING_WEEKDAYS.map((w) => (
                    <option key={w.bit} value={w.bit} disabled={intervalsForDay(schedule, w.bit).length === 0}>
                      {w.full}
                    </option>
                  ))}
                </select>
              </label>
              <span className="text-[11px] text-muted-foreground">para</span>
              {BOOKING_WEEKDAYS.filter((w) => w.bit !== copySource).map((w) => {
                const checked = copyTargets.includes(w.bit)
                return (
                  <button
                    key={w.bit}
                    type="button"
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-medium',
                      checked ? 'bg-brand text-white' : 'bg-muted text-muted-foreground',
                    )}
                    onClick={() =>
                      setCopyTargets((prev) =>
                        prev.includes(w.bit) ? prev.filter((d) => d !== w.bit) : [...prev, w.bit],
                      )
                    }
                  >
                    {w.label}
                  </button>
                )
              })}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={copyTargets.length === 0 || intervalsForDay(schedule, copySource).length === 0}
                onClick={copyIntervalsToDays}
              >
                Aplicar
              </Button>
            </div>
          </div>
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
      </div>

      {showSlotSettings ? <aside className="cb-agenda-availability-aside">{slotAndSave}</aside> : slotAndSave}
    </div>
  )
}
