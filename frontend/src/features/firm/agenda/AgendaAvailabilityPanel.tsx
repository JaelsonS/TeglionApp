import { useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { ChevronLeft, ChevronRight, Clock, Copy, Globe, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { AgendaDayAvailabilityDialog, type DayAvailabilityDraft } from '@/features/firm/agenda/AgendaDayAvailabilityDialog'
import { BOOKING_WEEKDAYS } from '@/features/firm/agenda/agendaCalendarUtils'
import {
  clearDayOverride,
  copyDayOverride,
  copyMonthDateOverrides,
  dayOverrideKind,
  effectiveIntervalsForDate,
  formatYearMonthPt,
  monthKeyFromParts,
  nextMonthKey,
  setDayOverride,
} from '@/features/firm/agenda/bookingDateOverrides'
import {
  defaultIntervalFromSchedule,
  hasCustomBookingHours,
  scheduleFromServiceOverrides,
} from '@/features/firm/services/serviceBookingAvailability'
import { CalendarMonthGrid, MONTH_NAMES_PT } from '@/shared/calendar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { DurationMinutesField } from '@/shared/design-system'
import type {
  AccountingService,
  BookingDateOverrides,
  BookingDaySchedule,
  FirmBookingSettings,
  TimeInterval,
} from '@/shared/types/contabil'
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
  /** Serviços bookable — resumo no dialog do dia (opcional). */
  bookableServices?: AccountingService[]
}

function intervalsForDay(schedule: BookingDaySchedule, day: number): TimeInterval[] {
  return schedule[day] || []
}

function serviceDayLabel(
  service: AccountingService,
  date: string,
  firmSchedule: BookingDaySchedule,
  firmOverrides: BookingDateOverrides,
): string {
  const custom = hasCustomBookingHours(service.bookingOverrides)
  const schedule = custom
    ? scheduleFromServiceOverrides(service.bookingOverrides, firmSchedule)
    : firmSchedule
  const overrides = custom
    ? ((service.bookingOverrides?.dateOverrides as BookingDateOverrides | undefined) || {})
    : firmOverrides
  const intervals = effectiveIntervalsForDate(date, schedule, overrides)
  if (!intervals.length) return 'Fechado'
  return intervals.map((iv) => `${iv.start}–${iv.end}`).join(', ')
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
    bookableServices,
  } = props

  const openDays = BOOKING_WEEKDAYS.filter((w) => intervalsForDay(schedule, w.bit).length > 0)
  const [copySource, setCopySource] = useState<number>(1)
  const [copyTargets, setCopyTargets] = useState<number[]>([])
  const [focusedDay, setFocusedDay] = useState<number>(1)
  const focusedWeekday = BOOKING_WEEKDAYS.find((w) => w.bit === focusedDay) ?? BOOKING_WEEKDAYS[0]
  const focusedIntervals = intervalsForDay(schedule, focusedWeekday.bit)
  const focusedOpen = focusedIntervals.length > 0

  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonthIndex, setCalMonthIndex] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayDialogOpen, setDayDialogOpen] = useState(false)

  const monthKey = monthKeyFromParts(calYear, calMonthIndex)
  const targetMonthKey = nextMonthKey(calYear, calMonthIndex)
  const monthOverrideCount = useMemo(
    () => Object.keys(dateOverrides).filter((d) => d.startsWith(`${monthKey}-`)).length,
    [dateOverrides, monthKey],
  )

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

  function openDayDialog(day: number) {
    const iso = `${monthKey}-${String(day).padStart(2, '0')}`
    setSelectedDate(iso)
    setDayDialogOpen(true)
  }

  function saveDayDraft(draft: DayAvailabilityDraft) {
    if (!onDateOverridesChange || !selectedDate) return
    if (draft.mode === 'inherit') {
      onDateOverridesChange(clearDayOverride(dateOverrides, selectedDate))
      return
    }
    if (draft.mode === 'closed') {
      onDateOverridesChange(setDayOverride(dateOverrides, selectedDate, []))
      return
    }
    onDateOverridesChange(setDayOverride(dateOverrides, selectedDate, draft.intervals))
  }

  function handleCopyFromDate(fromDate: string) {
    if (!onDateOverridesChange || !selectedDate) return
    onDateOverridesChange(copyDayOverride(dateOverrides, fromDate, selectedDate))
  }

  function handleCopyMonth() {
    if (!onDateOverridesChange) return
    const next = copyMonthDateOverrides(dateOverrides, monthKey, targetMonthKey)
    onDateOverridesChange(next)
    toast.success(`Excepções de ${formatYearMonthPt(monthKey)} copiadas para ${formatYearMonthPt(targetMonthKey)}.`, {
      description: 'Os meses são independentes — alterar um não muda o outro. Guarde a disponibilidade para persistir.',
    })
  }

  function shiftMonth(delta: number) {
    const d = new Date(calYear, calMonthIndex + delta, 1)
    setCalYear(d.getFullYear())
    setCalMonthIndex(d.getMonth())
  }

  const serviceSummaries = useMemo(() => {
    if (!selectedDate || !bookableServices?.length) return undefined
    return bookableServices.map((s) => ({
      id: s.id,
      name: s.name,
      label: serviceDayLabel(s, selectedDate, schedule, dateOverrides),
    }))
  }, [bookableServices, selectedDate, schedule, dateOverrides])

  const selectedWeekdayIntervals = selectedDate
    ? effectiveIntervalsForDate(selectedDate, schedule, {})
    : []

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

      {booking ? (
        <p className="cb-agenda-availability-summary">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {openDays.length
            ? `${openDays.length} dia(s) · slots de ${slotMin} min · horizonte ${horizon}d`
            : 'Nenhum dia seleccionado'}
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
            Escolha os dias da semana e os intervalos. Pode ter vários períodos no mesmo dia (ex.: manhã e
            tarde).
          </p>

          <div className="cb-agenda-weekday-grid" role="group" aria-label="Dias da semana">
            {BOOKING_WEEKDAYS.map((w) => {
              const open = intervalsForDay(schedule, w.bit).length > 0
              const focused = focusedDay === w.bit
              return (
                <button
                  key={w.bit}
                  type="button"
                  className={cn(
                    'cb-agenda-weekday-btn',
                    open && 'cb-agenda-weekday-btn-active',
                    focused && 'cb-agenda-weekday-btn-focus',
                  )}
                  aria-current={focused ? 'true' : undefined}
                  aria-label={open ? `Ver horário de ${w.full}` : `${w.full} indisponível`}
                  onClick={() => selectDay(w.bit)}
                >
                  <span className="cb-agenda-weekday-short">{w.label}</span>
                  <span className="cb-agenda-weekday-full">{w.full}</span>
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
                  focusedOpen
                    ? `${focusedWeekday.full} disponível`
                    : `${focusedWeekday.full} indisponível`
                }
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-semibold',
                  focusedOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground',
                )}
              >
                {focusedWeekday.full}
              </button>
              {focusedOpen ? (
                <div className="flex flex-wrap gap-1">
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
                    className="h-8 text-xs text-destructive"
                    onClick={() => toggleDay(focusedWeekday.bit)}
                  >
                    Fechar dia
                  </Button>
                </div>
              ) : null}
            </div>
            {focusedOpen ? (
              <>
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
                  </li>
                ))}
              </ul>

              <div className="mt-4 border-t border-border/40 pt-3">
                <p className="text-xs font-medium text-muted-foreground">Copiar horários para outros dias</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select
                    className="h-9 rounded-lg border border-border/60 bg-background px-2 text-xs"
                    value={copySource}
                    onChange={(e) => setCopySource(Number(e.target.value))}
                    aria-label="Dia de origem"
                  >
                    {BOOKING_WEEKDAYS.filter((w) => intervalsForDay(schedule, w.bit).length > 0).map((w) => (
                      <option key={w.bit} value={w.bit}>
                        {w.full}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-muted-foreground">→</span>
                  {BOOKING_WEEKDAYS.filter((w) => w.bit !== copySource).map((w) => {
                    const on = copyTargets.includes(w.bit)
                    return (
                      <button
                        key={w.bit}
                        type="button"
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                          on ? 'border-brand bg-brand text-primary-foreground' : 'border-border/60 text-muted-foreground',
                        )}
                        onClick={() =>
                          setCopyTargets((prev) =>
                            on ? prev.filter((d) => d !== w.bit) : [...prev, w.bit],
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
                    disabled={!copyTargets.length || intervalsForDay(schedule, copySource).length === 0}
                    onClick={copyIntervalsToDays}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
              </>
            ) : (
              <p className="cb-agenda-availability-warn mt-3">Seleccione pelo menos um dia.</p>
            )}
          </div>
        </div>

        {onDateOverridesChange ? (
          <div data-testid="agenda-date-overrides-calendar">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="cb-agenda-availability-label">Excepções por data</p>
                <p className="cb-agenda-availability-hint">
                  Clique num dia do mês para fechar, definir horário especial ou limpar a excepção.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  disabled={monthOverrideCount === 0}
                  onClick={handleCopyMonth}
                  data-testid="agenda-copy-month"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar mês → {formatYearMonthPt(targetMonthKey)}
                </Button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Mês anterior"
                onClick={() => shiftMonth(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="text-sm font-medium capitalize text-foreground">
                {MONTH_NAMES_PT[calMonthIndex]} {calYear}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Mês seguinte"
                onClick={() => shiftMonth(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="cb-fiscal-cal-grid-wrap mt-2">
              <CalendarMonthGrid
                year={calYear}
                monthIndex={calMonthIndex}
                renderDay={(day, isToday) => {
                  const iso = `${monthKey}-${String(day).padStart(2, '0')}`
                  const kind = dayOverrideKind(iso, dateOverrides)
                  return (
                    <button
                      type="button"
                      className={cn(
                        'flex h-full min-h-[3.25rem] w-full flex-col items-start gap-0.5 rounded-lg p-1.5 text-left transition hover:bg-muted/40',
                        kind === 'closed' && 'bg-rose-50 ring-1 ring-inset ring-rose-200',
                        kind === 'custom' && 'bg-amber-50 ring-1 ring-inset ring-amber-200',
                        isToday && kind === 'none' && 'ring-1 ring-inset ring-brand/40',
                      )}
                      onClick={() => openDayDialog(day)}
                      data-testid={`agenda-override-day-${iso}`}
                    >
                      <span
                        className={cn(
                          'cb-fiscal-cal-day-num inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                          isToday && 'bg-brand text-primary-foreground',
                        )}
                      >
                        {day}
                      </span>
                      {kind === 'closed' ? (
                        <span className="text-[10px] font-medium text-rose-700">Fechado</span>
                      ) : null}
                      {kind === 'custom' ? (
                        <span className="line-clamp-2 text-[10px] font-medium text-amber-800">
                          {(dateOverrides[iso] || [])
                            .map((iv) => `${iv.start}–${iv.end}`)
                            .join(' · ')}
                        </span>
                      ) : null}
                    </button>
                  )
                }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {monthOverrideCount === 0
                ? 'Sem excepções neste mês — usa o horário semanal.'
                : `${monthOverrideCount} excepção(ões) em ${formatYearMonthPt(monthKey)}.`}
            </p>
          </div>
        ) : null}
      </div>

      {showSlotSettings ? <aside className="cb-agenda-availability-aside">{slotAndSave}</aside> : slotAndSave}

      {onDateOverridesChange ? (
        <AgendaDayAvailabilityDialog
          open={dayDialogOpen}
          onOpenChange={setDayDialogOpen}
          date={selectedDate}
          hasOverride={
            !!selectedDate && Object.prototype.hasOwnProperty.call(dateOverrides, selectedDate)
          }
          overrideIntervals={selectedDate ? dateOverrides[selectedDate] : undefined}
          weekdayIntervals={selectedWeekdayIntervals}
          defaultInterval={defaultIntervalFromSchedule(schedule) || defaultInterval}
          serviceSummaries={serviceSummaries}
          onSave={saveDayDraft}
          onCopyFromDate={handleCopyFromDate}
        />
      ) : null}
    </div>
  )
}
