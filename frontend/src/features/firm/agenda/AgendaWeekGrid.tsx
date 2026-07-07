import type { Consultation } from '@/shared/types/contabil'
import { AgendaCalendarGrid } from './AgendaCalendarGrid'
import { weekDays } from './agendaCalendarUtils'

type Props = {
  anchor: Date
  items: Consultation[]
  staffName: (staffId?: string | null) => string
  clientName: (clientId: string) => string
  onSelectEvent?: (c: Consultation) => void
}

export function AgendaWeekGrid(props: Props) {
  const days = weekDays(props.anchor)
  return (
    <AgendaCalendarGrid
      days={days}
      items={props.items}
      staffName={props.staffName}
      clientName={props.clientName}
      onSelectEvent={props.onSelectEvent}
    />
  )
}
