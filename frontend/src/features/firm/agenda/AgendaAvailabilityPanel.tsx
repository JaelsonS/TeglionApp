import { useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { CalendarDays, ChevronLeft, ChevronRight, Copy, MapPin, Plus, Trash2 } from 'lucide-react'
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

const SLOT_PRESETS = [15, 30, 45, 60] as const
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

function formatSelectedDateShort(iso: string): string {
  const [, m, d] = iso.split('-')
  const monthIdx = Number(m) - 1
  const monthShort = (MONTH_NAMES_PT[monthIdx] || '').slice(0, 3).toLowerCase()
  return `${Number(d)} ${monthShort}`
}

export function AgendaAvailabilityPanel(props: Props) {
  const {
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
  const [focusedDay, setFocusedDay] = useState<number>(1)

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

  function updateInterval(day: number, index: number, patch: Partial<TimeInterval>) {
    const current = [...intervalsForDay(schedule, day)]
    current[index] = { ...current[index], ...patch }
    setDayIntervals(day, current)
  }

  function addInterval(day: number) {
    const current = intervalsForDay(schedule, day)
    setDayIntervals(day, [...current, { start: '14:00', end: '17:00' }])
    setFocusedDay(day)
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

  const selectedKind = selectedDate ? dayOverrideKind(selectedDate, dateOverrides) : 'none'
  const selectedEffective = selectedDate
    ? effectiveIntervalsForDate(selectedDate, schedule, dateOverrides)
    : []
  const selectedSummaryLabel =
    selectedKind === 'closed'
      ? 'Fechado'
      : selectedKind === 'custom'
        ? 'Especial'
        : 'Herdado'
  const selectedSummaryTimes =
    selectedKind === 'closed'
      ? null
      : selectedEffective.length
        ? selectedEffective.map((iv) => `${iv.start}–${iv.end}`).join(' · ')
        : 'Fechado (semanal)'

  const fromMonthLabel = MONTH_NAMES_PT[calMonthIndex]?.toLowerCase() || ''
  const toParts = targetMonthKey.split('-')
  const toMonthLabel = MONTH_NAMES_PT[Number(toParts[1]) - 1]?.toLowerCase() || formatYearMonthPt(targetMonthKey)

  const weeklyPanel = (
    <section className="cb-agenda-avail-card" aria-labelledby="agenda-horario-semanal-title">
      <h4 id="agenda-horario-semanal-title" className="cb-agenda-avail-card-title">
        Horário semanal
      </h4>
      <ul className="cb-agenda-week-list" role="list">
        {BOOKING_WEEKDAYS.map((w) => {
          const intervals = intervalsForDay(schedule, w.bit)
          const open = intervals.length > 0
          const focused = focusedDay === w.bit
          return (
            <li
              key={w.bit}
              className={cn('cb-agenda-week-row', focused && 'cb-agenda-week-row-focus')}
            >
              <button
                type="button"
                className="cb-agenda-week-row-day"
                onClick={() => setFocusedDay(w.bit)}
                aria-current={focused ? 'true' : undefined}
              >
                <span className="cb-agenda-week-row-name">
                  {w.bit === 0 || w.bit === 6 ? w.full : `${w.full}-feira`}
                </span>
              </button>
              <button
                type="button"
                className={cn(
                  'cb-agenda-week-badge',
                  open ? 'cb-agenda-week-badge-open' : 'cb-agenda-week-badge-closed',
                )}
                aria-pressed={open}
                aria-label={
                  open ? `${w.full} disponível — clicar para fechar` : `${w.full} indisponível — clicar para abrir`
                }
                onClick={() => toggleDay(w.bit)}
              >
                {open ? 'Aberto' : 'Fechado'}
              </button>
              <div className="cb-agenda-week-intervals">
                {open ? (
                  <>
                    {intervals.map((iv, idx) => (
                      <div key={`${w.bit}-${idx}`} className="cb-agenda-week-interval">
                        <Input
                          type="time"
                          className="cb-agenda-week-time"
                          value={iv.start}
                          aria-label={`${w.full} início intervalo ${idx + 1}`}
                          onChange={(e: FormChangeEvent) =>
                            updateInterval(w.bit, idx, { start: e.target.value })
                          }
                          onFocus={() => setFocusedDay(w.bit)}
                        />
                        <span className="cb-agenda-week-time-sep" aria-hidden>
                          –
                        </span>
                        <Input
                          type="time"
                          className="cb-agenda-week-time"
                          value={iv.end}
                          aria-label={`${w.full} fim intervalo ${idx + 1}`}
                          onChange={(e: FormChangeEvent) =>
                            updateInterval(w.bit, idx, { end: e.target.value })
                          }
                          onFocus={() => setFocusedDay(w.bit)}
                        />
                        {intervals.length > 1 ? (
                          <button
                            type="button"
                            className="cb-agenda-week-interval-remove"
                            aria-label={`Remover intervalo ${idx + 1} de ${w.full}`}
                            onClick={() => removeInterval(w.bit, idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="cb-agenda-week-add"
                      aria-label={`Adicionar intervalo em ${w.full}`}
                      onClick={() => addInterval(w.bit)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <span className="cb-agenda-week-closed-hint">Sem atendimento</span>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {openDays.length === 0 ? (
        <p className="cb-agenda-availability-warn">Seleccione pelo menos um dia.</p>
      ) : null}

      {hideSaveButton ? null : (
        <Button
          className="cb-agenda-save-btn cb-agenda-avail-save mt-4 w-full gap-2"
          type="button"
          onClick={onSaveAvailability}
          disabled={openDays.length === 0}
        >
          <CalendarDays className="h-4 w-4" aria-hidden />
          Guardar horário
        </Button>
      )}
    </section>
  )

  const exceptionsPanel = onDateOverridesChange ? (
    <section
      className="cb-agenda-avail-card"
      aria-labelledby="agenda-excepcoes-title"
      data-testid="agenda-date-overrides-calendar"
    >
      <div className="cb-agenda-avail-card-hd">
        <h4 id="agenda-excepcoes-title" className="cb-agenda-avail-card-title">
          Excepções do mês
        </h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cb-agenda-copy-month-btn h-8 gap-1.5 text-xs"
          disabled={monthOverrideCount === 0}
          onClick={handleCopyMonth}
          data-testid="agenda-copy-month"
        >
          <Copy className="h-3.5 w-3.5" />
          Copiar {fromMonthLabel} → {toMonthLabel}
        </Button>
      </div>

      <div className="cb-agenda-month-nav">
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
        <p className="cb-agenda-month-nav-label">
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

      <div className="cb-agenda-month-grid-wrap">
        <CalendarMonthGrid
          year={calYear}
          monthIndex={calMonthIndex}
          className="cb-agenda-month-grid"
          renderDay={(day, isToday) => {
            const iso = `${monthKey}-${String(day).padStart(2, '0')}`
            const kind = dayOverrideKind(iso, dateOverrides)
            const selected = selectedDate === iso
            const weekday = new Date(calYear, calMonthIndex, day).getDay()
            const weekend = weekday === 0 || weekday === 6
            return (
              <button
                type="button"
                className={cn(
                  'cb-agenda-month-day',
                  weekend && kind === 'none' && 'cb-agenda-month-day-weekend',
                  kind === 'closed' && 'cb-agenda-month-day-closed',
                  kind === 'custom' && 'cb-agenda-month-day-special',
                  selected && 'cb-agenda-month-day-selected',
                  isToday && kind === 'none' && !selected && 'cb-agenda-month-day-today',
                )}
                onClick={() => openDayDialog(day)}
                data-testid={`agenda-override-day-${iso}`}
              >
                <span className="cb-agenda-month-day-num">{day}</span>
                {kind !== 'none' ? (
                  <span
                    className={cn(
                      'cb-agenda-month-day-dot',
                      kind === 'closed' && 'cb-agenda-month-day-dot-closed',
                      kind === 'custom' && 'cb-agenda-month-day-dot-special',
                    )}
                    aria-hidden
                  />
                ) : null}
              </button>
            )
          }}
        />
      </div>

      <ul className="cb-agenda-month-legend" aria-label="Legenda do calendário">
        <li>
          <span className="cb-agenda-month-legend-dot cb-agenda-month-legend-dot-inherit" />
          Herdado
        </li>
        <li>
          <span className="cb-agenda-month-legend-dot cb-agenda-month-legend-dot-special" />
          Especial
        </li>
        <li>
          <span className="cb-agenda-month-legend-dot cb-agenda-month-legend-dot-closed" />
          Fechado
        </li>
      </ul>

      {selectedDate ? (
        <div className="cb-agenda-month-selected">
          <span
            className={cn(
              'cb-agenda-month-selected-dot',
              selectedKind === 'closed' && 'cb-agenda-month-day-dot-closed',
              selectedKind === 'custom' && 'cb-agenda-month-day-dot-special',
              selectedKind === 'none' && 'cb-agenda-month-legend-dot-inherit',
            )}
            aria-hidden
          />
          <p className="cb-agenda-month-selected-text">
            <span className="font-medium">{formatSelectedDateShort(selectedDate)}</span>
            {' — '}
            {selectedSummaryLabel}
            {selectedSummaryTimes ? ` — ${selectedSummaryTimes}` : ''}
          </p>
          <button
            type="button"
            className="cb-agenda-month-selected-edit"
            onClick={() => setDayDialogOpen(true)}
          >
            Editar
          </button>
        </div>
      ) : (
        <p className="cb-agenda-month-selected-empty">
          {monthOverrideCount === 0
            ? 'Clique num dia para fechar ou definir horário especial.'
            : `${monthOverrideCount} excepção(ões) em ${formatYearMonthPt(monthKey)}.`}
        </p>
      )}
    </section>
  ) : null

  const optionsPanel = showSlotSettings ? (
    <aside className="cb-agenda-avail-options" aria-label="Opções de marcação">
      <div className="cb-agenda-avail-option-card">
        <p className="cb-agenda-avail-option-label">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          Fuso horário
        </p>
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
      </div>

      <div className="cb-agenda-avail-option-card">
        <p className="cb-agenda-avail-option-label">Duração do agendamento</p>
        <div className="cb-agenda-slot-chip-grid" role="group" aria-label="Duração do slot">
          {SLOT_PRESETS.map((mins) => (
            <button
              key={mins}
              type="button"
              className={cn(
                'cb-agenda-slot-chip',
                slotMin === mins && 'cb-agenda-slot-chip-on',
              )}
              aria-pressed={slotMin === mins}
              onClick={() => onSlotMin(mins)}
            >
              {mins} min
            </button>
          ))}
        </div>
      </div>

      <div className="cb-agenda-avail-option-card">
        <p className="cb-agenda-avail-option-label">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          Horizonte de marcação
        </p>
        <select
          className="cb-agenda-field-input"
          value={String(horizon)}
          onChange={(e) => onHorizon(Number(e.target.value))}
          aria-label="Horizonte em dias"
        >
          {[7, 14, 21, 30, 45, 60].map((d) => (
            <option key={d} value={d}>
              {d} dias
            </option>
          ))}
          {!([7, 14, 21, 30, 45, 60] as number[]).includes(horizon) ? (
            <option value={horizon}>{horizon} dias</option>
          ) : null}
        </select>
        <p className="cb-agenda-avail-option-hint">
          Os clientes podem reservar até {horizon} dias no futuro.
        </p>
      </div>
    </aside>
  ) : null

  return (
    <div
      className={cn(
        'cb-agenda-availability',
        showSlotSettings && onDateOverridesChange && 'cb-agenda-availability-trio',
        showSlotSettings && !onDateOverridesChange && 'cb-agenda-availability-layout',
        !showSlotSettings && onDateOverridesChange && 'cb-agenda-availability-duo',
      )}
    >
      {weeklyPanel}
      {exceptionsPanel}
      {optionsPanel}

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
