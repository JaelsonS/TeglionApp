import type { Consultation } from '@/shared/types/contabil'

export type AgendaViewMode = 'day' | 'week' | 'month'

const HOUR_START = 8
const HOUR_END = 19
const HOUR_HEIGHT_PX = 52

export function agendaHours() {
  const hours: number[] = []
  for (let h = HOUR_START; h <= HOUR_END; h += 1) hours.push(h)
  return hours
}

export function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function startOfWeekMonday(date: Date) {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function startOfMonth(date: Date) {
  const d = startOfDay(date)
  d.setDate(1)
  return d
}

export function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function toDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function weekDays(anchor: Date) {
  const start = startOfWeekMonday(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function monthMatrix(anchor: Date) {
  const y = anchor.getFullYear()
  const m = anchor.getMonth()
  const first = new Date(y, m, 1)
  const start = new Date(first)
  const dow = start.getDay()
  start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1))
  const weeks: Date[][] = []
  let cursor = new Date(start)
  for (let w = 0; w < 6; w += 1) {
    const row: Date[] = []
    for (let d = 0; d < 7; d += 1) {
      row.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(row)
  }
  return { weeks, month: m, year: y }
}

export function normalizeAnchor(view: AgendaViewMode, anchor: Date) {
  if (view === 'day') return startOfDay(anchor)
  if (view === 'month') return startOfMonth(anchor)
  return startOfWeekMonday(anchor)
}

export function dateRangeForView(view: AgendaViewMode, anchor: Date) {
  const a = normalizeAnchor(view, anchor)
  if (view === 'day') {
    const end = new Date(a)
    end.setHours(23, 59, 59, 999)
    return { from: toDateKey(a), to: end.toISOString() }
  }
  if (view === 'month') {
    const end = new Date(a.getFullYear(), a.getMonth() + 1, 0, 23, 59, 59, 999)
    return { from: toDateKey(a), to: end.toISOString() }
  }
  const end = addDays(a, 6)
  end.setHours(23, 59, 59, 999)
  return { from: toDateKey(a), to: end.toISOString() }
}

export function formatNavLabel(view: AgendaViewMode, anchor: Date) {
  if (view === 'day') {
    return anchor.toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
  if (view === 'month') {
    return anchor.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
  }
  return formatWeekRangeLabel(anchor)
}

export function formatWeekRangeLabel(anchor: Date) {
  const days = weekDays(anchor)
  const first = days[0]
  const last = days[6]
  const fmt = (d: Date) =>
    d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
  const sameYear = first.getFullYear() === last.getFullYear()
  const sameMonth = sameYear && first.getMonth() === last.getMonth()
  if (sameMonth) {
    return `Semana de ${first.getDate()}–${last.getDate()} ${last.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}`
  }
  return `Semana de ${fmt(first)} – ${fmt(last)}`
}

export function formatDayHeader(d: Date, todayKey: string) {
  const key = toDateKey(d)
  const weekday = d.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', '')
  const dayNum = d.getDate()
  return { key, weekday, dayNum, isToday: key === todayKey }
}

export function eventsForDay(items: Consultation[], dayKey: string) {
  return items
    .filter((c) => c.scheduledAt.slice(0, 10) === dayKey)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
}

export function eventLayout(scheduledAt: string, durationMinutes = 60) {
  const start = new Date(scheduledAt)
  const startMin = start.getHours() * 60 + start.getMinutes()
  const dayStartMin = HOUR_START * 60
  const dayEndMin = (HOUR_END + 1) * 60
  const endMin = Math.min(startMin + durationMinutes, dayEndMin)
  const top = ((startMin - dayStartMin) / 60) * HOUR_HEIGHT_PX
  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT_PX, 28)
  return { top, height, gridHeight: (HOUR_END - HOUR_START + 1) * HOUR_HEIGHT_PX }
}

export function formatEventTimeRange(scheduledAt: string, durationMinutes = 60) {
  const start = new Date(scheduledAt)
  const end = new Date(start.getTime() + durationMinutes * 60_000)
  const fmt = (d: Date) => d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  return `${fmt(start)} - ${fmt(end)}`
}

export function eventTone(c: Consultation, index: number) {
  const t = (c.title || '').toLowerCase()
  if (t.includes('intern')) return 'cb-agenda-event-internal'
  const tones = ['cb-agenda-event-blue', 'cb-agenda-event-amber', 'cb-agenda-event-green']
  return tones[index % tones.length]
}

/** Dias da semana (dayjs/day(): 0=Dom … 6=Sáb) — ordem Segunda a Domingo na UI. */
export const BOOKING_WEEKDAYS = [
  { bit: 1, label: 'Seg', full: 'Segunda' },
  { bit: 2, label: 'Ter', full: 'Terça' },
  { bit: 3, label: 'Qua', full: 'Quarta' },
  { bit: 4, label: 'Qui', full: 'Quinta' },
  { bit: 5, label: 'Sex', full: 'Sexta' },
  { bit: 6, label: 'Sáb', full: 'Sábado' },
  { bit: 0, label: 'Dom', full: 'Domingo' },
] as const

export { HOUR_HEIGHT_PX, HOUR_START, HOUR_END }
