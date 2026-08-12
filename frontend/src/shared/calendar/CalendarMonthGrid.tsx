import type { ReactNode } from 'react'

import {
  daysInMonth,
  firstWeekdayMonday,
  WEEKDAY_LABELS_PT,
} from '@/shared/calendar'
import { cn } from '@/shared/lib/utils'

/**
 * Grelha mensal reutilizável (segunda→domingo).
 * Consumer: Calendário Fiscal; futuro: outros módulos de datas.
 */
export function CalendarMonthGrid({
  year,
  monthIndex,
  renderDay,
  className,
}: {
  year: number
  monthIndex: number
  renderDay: (day: number, isToday: boolean) => ReactNode
  className?: string
}) {
  const totalDays = daysInMonth(year, monthIndex)
  const padStart = firstWeekdayMonday(year, monthIndex)
  const cells: (number | null)[] = [
    ...Array.from({ length: padStart }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === monthIndex && today.getDate() === day

  return (
    <div className={cn('cb-fiscal-cal-grid', className)}>
      {WEEKDAY_LABELS_PT.map((wd) => (
        <div key={wd} className="cb-fiscal-cal-weekday">
          {wd}
        </div>
      ))}
      {cells.map((day, idx) => {
        if (day === null) {
          return <div key={`empty-${idx}`} className="cb-fiscal-cal-cell cb-fiscal-cal-cell-empty" />
        }
        const todayCell = isToday(day)
        return (
          <div
            key={day}
            className={cn(
              'cb-fiscal-cal-cell',
              todayCell && 'cb-fiscal-cal-cell-today',
            )}
          >
            {renderDay(day, todayCell)}
          </div>
        )
      })}
    </div>
  )
}
