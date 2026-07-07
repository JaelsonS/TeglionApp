import type { Consultation } from '@/shared/types/contabil'
import { cn } from '@/shared/lib/utils'
import {
  eventTone,
  eventsForDay,
  formatEventTimeRange,
  monthMatrix,
  toDateKey,
} from './agendaCalendarUtils'

const WEEK_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

type Props = {
  anchor: Date
  items: Consultation[]
  onSelectDay: (day: Date) => void
  onSelectEvent?: (c: Consultation) => void
}

export function AgendaMonthGrid({ anchor, items, onSelectDay, onSelectEvent }: Props) {
  const { weeks, month, year } = monthMatrix(anchor)
  const todayKey = toDateKey(new Date())

  return (
    <div className="cb-agenda-month-wrap">
      <div className="cb-agenda-month-hd-row">
        {WEEK_HEADERS.map((h) => (
          <div key={h} className="cb-agenda-month-weekday">
            {h}
          </div>
        ))}
      </div>
      {weeks.map((row, wi) => (
        <div key={wi} className="cb-agenda-month-row">
          {row.map((d) => {
            const key = toDateKey(d)
            const inMonth = d.getMonth() === month && d.getFullYear() === year
            const isToday = key === todayKey
            const dayEvents = eventsForDay(items, key)

            return (
              <button
                key={key}
                type="button"
                className={cn(
                  'cb-agenda-month-cell',
                  !inMonth && 'cb-agenda-month-cell-out',
                  isToday && 'cb-agenda-month-cell-today',
                )}
                onClick={() => onSelectDay(d)}
              >
                <span className="cb-agenda-month-daynum">{d.getDate()}</span>
                <div className="cb-agenda-month-events">
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <span
                      key={ev._id}
                      role="presentation"
                      className={cn('cb-agenda-month-pill', eventTone(ev, i))}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectEvent?.(ev)
                      }}
                    >
                      <span className="truncate">
                        {formatEventTimeRange(ev.scheduledAt, ev.durationMinutes).split(' - ')[0]}{' '}
                        {ev.title}
                      </span>
                    </span>
                  ))}
                  {dayEvents.length > 3 ? (
                    <span className="cb-agenda-month-more">+{dayEvents.length - 3}</span>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      ))}
      {items.length === 0 ? (
        <p className="cb-agenda-month-empty">Sem eventos neste mês.</p>
      ) : null}
    </div>
  )
}
