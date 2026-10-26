import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  MONTH_NAMES_PT,
  WEEKDAY_LABELS_PT,
  daysInMonth,
  firstWeekdayMonday,
  parseCivilDate,
} from '@/shared/calendar'
import { cn } from '@/shared/lib/utils'
import { formatSlotTime, groupSlotsByDay, slotDayKey } from '@/features/public-intake/groupPublicSlots'

type Props = {
  slots: string[]
  loading?: boolean
  value: string
  onChange: (iso: string) => void
  timeZone?: string
}

function monthCursorFromKey(dateKey: string): { year: number; monthIndex: number } | null {
  const parts = parseCivilDate(dateKey)
  if (!parts) return null
  return { year: parts.y, monthIndex: parts.m - 1 }
}

function shiftMonth(year: number, monthIndex: number, delta: number) {
  const d = new Date(year, monthIndex + delta, 1)
  return { year: d.getFullYear(), monthIndex: d.getMonth() }
}

function civilKey(year: number, monthIndex: number, day: number) {
  const m = String(monthIndex + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

export function PublicSlotCalendar({ slots, loading, value, onChange, timeZone = 'Europe/Lisbon' }: Props) {
  const groups = useMemo(() => groupSlotsByDay(slots, timeZone), [slots, timeZone])
  const availableKeys = useMemo(() => new Set(groups.map((g) => g.dateKey)), [groups])

  const initialDay = value ? slotDayKey(value, timeZone) : groups[0]?.dateKey || ''
  const [dayKey, setDayKey] = useState(initialDay)

  const seedMonth = monthCursorFromKey(initialDay) || monthCursorFromKey(groups[0]?.dateKey || '')
  const [cursor, setCursor] = useState(() => seedMonth || { year: new Date().getFullYear(), monthIndex: new Date().getMonth() })

  useEffect(() => {
    if (value) {
      const key = slotDayKey(value, timeZone)
      setDayKey(key)
      const m = monthCursorFromKey(key)
      if (m) setCursor(m)
      return
    }
    if (!groups.some((g) => g.dateKey === dayKey)) {
      const next = groups[0]?.dateKey || ''
      setDayKey(next)
      const m = monthCursorFromKey(next)
      if (m) setCursor(m)
    }
  }, [value, timeZone, groups, dayKey])

  const selectedDay = groups.find((g) => g.dateKey === dayKey) || groups[0]

  const monthHasAvailability = useMemo(() => {
    const prefix = `${cursor.year}-${String(cursor.monthIndex + 1).padStart(2, '0')}-`
    return [...availableKeys].some((k) => k.startsWith(prefix))
  }, [availableKeys, cursor])

  const minMonth = monthCursorFromKey(groups[0]?.dateKey || '')
  const maxMonth = monthCursorFromKey(groups[groups.length - 1]?.dateKey || '')

  const canGoPrev =
    minMonth &&
    (cursor.year > minMonth.year || (cursor.year === minMonth.year && cursor.monthIndex > minMonth.monthIndex))
  const canGoNext =
    maxMonth &&
    (cursor.year < maxMonth.year || (cursor.year === maxMonth.year && cursor.monthIndex < maxMonth.monthIndex))

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar horários disponíveis…
      </p>
    )
  }

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem horários disponíveis de momento.</p>
  }

  const totalDays = daysInMonth(cursor.year, cursor.monthIndex)
  const padStart = firstWeekdayMonday(cursor.year, cursor.monthIndex)
  const cells: (number | null)[] = [
    ...Array.from({ length: padStart }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const selectDay = (key: string) => {
    setDayKey(key)
    if (value && slotDayKey(value, timeZone) !== key) onChange('')
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-muted disabled:opacity-30"
            disabled={!canGoPrev}
            aria-label="Mês anterior"
            onClick={() => setCursor((c) => shiftMonth(c.year, c.monthIndex, -1))}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <p className="text-sm font-semibold tracking-tight text-foreground">
            {MONTH_NAMES_PT[cursor.monthIndex]} {cursor.year}
          </p>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-muted disabled:opacity-30"
            disabled={!canGoNext}
            aria-label="Mês seguinte"
            onClick={() => setCursor((c) => shiftMonth(c.year, c.monthIndex, 1))}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 px-2 pb-1 pt-2">
          {WEEKDAY_LABELS_PT.map((wd) => (
            <div key={wd} className="pb-1 text-center text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              {wd}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 px-2 pb-3">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />
            }
            const key = civilKey(cursor.year, cursor.monthIndex, day)
            const available = availableKeys.has(key)
            const selected = dayKey === key
            const slotCount = groups.find((g) => g.dateKey === key)?.slots.length ?? 0

            return (
              <button
                key={key}
                type="button"
                disabled={!available}
                onClick={() => selectDay(key)}
                aria-label={
                  available
                    ? `${day} de ${MONTH_NAMES_PT[cursor.monthIndex]}, ${slotCount} horário${slotCount === 1 ? '' : 's'}`
                    : `${day} de ${MONTH_NAMES_PT[cursor.monthIndex]}, indisponível`
                }
                className={cn(
                  'relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition',
                  available
                    ? 'font-medium text-foreground hover:bg-primary/10'
                    : 'cursor-not-allowed text-muted-foreground/35',
                  selected && available && 'bg-primary text-primary-foreground hover:bg-primary',
                )}
              >
                <span>{day}</span>
                {available && !selected ? (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-primary" aria-hidden />
                ) : null}
              </button>
            )
          })}
        </div>

        {!monthHasAvailability ? (
          <p className="border-t border-border/60 px-3 py-2 text-center text-xs text-muted-foreground">
            Sem horários neste mês — use as setas para ver outros meses.
          </p>
        ) : null}
      </div>

      {selectedDay ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Horários ·{' '}
            <span className="font-normal text-muted-foreground">{selectedDay.label}</span>
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {selectedDay.slots.map((iso) => {
              const selected = value === iso
              return (
                <Button
                  key={iso}
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  className="h-10 rounded-xl"
                  onClick={() => onChange(iso)}
                >
                  {formatSlotTime(iso, timeZone)}
                </Button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
