import type { Consultation } from '@/shared/types/contabil'
import { cn } from '@/shared/lib/utils'
import {
  agendaHours,
  eventLayout,
  eventTone,
  eventsForDay,
  formatDayHeader,
  formatEventTimeRange,
  HOUR_HEIGHT_PX,
} from './agendaCalendarUtils'

type Props = {
  days: Date[]
  items: Consultation[]
  staffName: (staffId?: string | null) => string
  clientName: (clientId: string) => string
  onSelectEvent?: (c: Consultation) => void
}

export function AgendaCalendarGrid({ days, items, staffName, clientName, onSelectEvent }: Props) {
  const todayKey = toDateKeyLocal(new Date())
  const hours = agendaHours()

  return (
    <div className="cb-agenda-grid-wrap">
      <div className={cn('cb-agenda-grid', days.length === 1 && 'cb-agenda-grid-day')}>
        <div className="cb-agenda-grid-time-col">
          <div className="cb-agenda-grid-corner" />
          {hours.map((h) => (
            <div key={h} className="cb-agenda-grid-hour" style={{ height: HOUR_HEIGHT_PX }}>
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {days.map((day, dayIdx) => {
          const { key, weekday, dayNum, isToday } = formatDayHeader(day, todayKey)
          const dayEvents = eventsForDay(items, key)
          const { gridHeight } = eventLayout(dayEvents[0]?.scheduledAt || `${key}T09:00:00`, 60)

          return (
            <div key={key} className="cb-agenda-grid-day-col">
              <div className={cn('cb-agenda-grid-day-hd', isToday && 'cb-agenda-grid-day-hd-today')}>
                <span className="cb-agenda-grid-weekday">{weekday}</span>
                <span className={cn('cb-agenda-grid-daynum', isToday && 'cb-agenda-grid-daynum-today')}>
                  {dayNum}
                </span>
              </div>
              <div className="cb-agenda-grid-cells" style={{ height: gridHeight }}>
                {hours.map((h) => (
                  <div key={h} className="cb-agenda-grid-cell" style={{ height: HOUR_HEIGHT_PX }} />
                ))}
                {dayEvents.map((ev, i) => {
                  const layout = eventLayout(ev.scheduledAt, ev.durationMinutes || 60)
                  const assignee = staffName(ev.staffId) || clientName(ev.clientId)
                  return (
                    <button
                      key={ev._id}
                      type="button"
                      className={cn('cb-agenda-event', eventTone(ev, dayIdx + i))}
                      style={{ top: layout.top, height: layout.height }}
                      onClick={() => onSelectEvent?.(ev)}
                    >
                      <span className="cb-agenda-event-time">
                        {formatEventTimeRange(ev.scheduledAt, ev.durationMinutes)}
                      </span>
                      <span className="cb-agenda-event-title">{ev.title}</span>
                      <span className="cb-agenda-event-meta">{assignee}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function toDateKeyLocal(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
