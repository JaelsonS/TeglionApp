import {
  BOOKING_WEEKDAYS,
  cloneBookingSchedule,
  weekdaysFromSchedule,
} from '@/features/firm/agenda/agendaCalendarUtils'
import type {
  AccountingService,
  BookingDaySchedule,
  FirmBookingSettings,
  TimeInterval,
} from '@/shared/types/contabil'

/** Último recurso visual — o editor deve semear a partir de GET /contabil/booking-settings. */
export const FALLBACK_INTERVAL: TimeInterval = { start: '09:00', end: '17:00' }

export function hasCustomBookingHours(overrides?: Partial<FirmBookingSettings> | null): boolean {
  if (!overrides || typeof overrides !== 'object') return false
  if (overrides.schedule) {
    for (const intervals of Object.values(overrides.schedule)) {
      if (Array.isArray(intervals) && intervals.length > 0) return true
    }
  }
  if (Array.isArray(overrides.weekdays) && overrides.weekdays.length > 0) return true
  if (overrides.dateOverrides && typeof overrides.dateOverrides === 'object') {
    return Object.keys(overrides.dateOverrides).length > 0
  }
  return false
}

export function scheduleFromFirmBooking(
  booking:
    | Pick<FirmBookingSettings, 'schedule' | 'weekdays' | 'dayStart' | 'dayEnd'>
    | null
    | undefined,
): BookingDaySchedule {
  if (booking?.schedule && Object.keys(booking.schedule).length) {
    return cloneBookingSchedule(booking.schedule)
  }
  const next: BookingDaySchedule = {}
  const days = booking?.weekdays?.length ? booking.weekdays : []
  const start = booking?.dayStart || FALLBACK_INTERVAL.start
  const end = booking?.dayEnd || FALLBACK_INTERVAL.end
  for (const d of days) {
    next[d] = [{ start, end }]
  }
  return next
}

export function scheduleFromServiceOverrides(
  overrides: Partial<FirmBookingSettings> | null | undefined,
  firmSchedule: BookingDaySchedule,
): BookingDaySchedule {
  if (!hasCustomBookingHours(overrides)) return cloneBookingSchedule(firmSchedule)
  if (overrides?.schedule && Object.keys(overrides.schedule).length) {
    return cloneBookingSchedule(overrides.schedule)
  }
  const filtered: BookingDaySchedule = {}
  for (const d of overrides?.weekdays || []) {
    const intervals = firmSchedule[d]
    if (intervals?.length) filtered[d] = intervals.map((iv) => ({ ...iv }))
  }
  return Object.keys(filtered).length ? filtered : cloneBookingSchedule(firmSchedule)
}

export function bookingOverridesFromSchedule(
  schedule: BookingDaySchedule,
  dateOverrides?: FirmBookingSettings['dateOverrides'],
): {
  weekdays: number[]
  schedule: BookingDaySchedule
  dateOverrides?: FirmBookingSettings['dateOverrides']
} {
  const payload: {
    weekdays: number[]
    schedule: BookingDaySchedule
    dateOverrides?: FirmBookingSettings['dateOverrides']
  } = {
    weekdays: weekdaysFromSchedule(schedule),
    schedule: cloneBookingSchedule(schedule),
  }
  if (dateOverrides && Object.keys(dateOverrides).length > 0) {
    payload.dateOverrides = { ...dateOverrides }
    for (const [date, intervals] of Object.entries(dateOverrides)) {
      payload.dateOverrides[date] = (intervals || []).map((iv) => ({ start: iv.start, end: iv.end }))
    }
  }
  return payload
}

export function bookingOverridesPayload(
  enabled: boolean,
  schedule: BookingDaySchedule,
  dateOverrides?: FirmBookingSettings['dateOverrides'],
): {
  weekdays: number[]
  schedule: BookingDaySchedule
  dateOverrides?: FirmBookingSettings['dateOverrides']
} | null {
  if (!enabled) return null
  return bookingOverridesFromSchedule(schedule, dateOverrides)
}

export function defaultIntervalFromSchedule(schedule: BookingDaySchedule): TimeInterval {
  for (const w of BOOKING_WEEKDAYS) {
    const first = schedule[w.bit]?.[0]
    if (first?.start && first?.end) return { start: first.start, end: first.end }
  }
  return { ...FALLBACK_INTERVAL }
}

export function summarizeBookingSchedule(schedule: BookingDaySchedule): string {
  const parts: string[] = []
  for (const w of BOOKING_WEEKDAYS) {
    const intervals = schedule[w.bit] || []
    if (!intervals.length) continue
    const hours = intervals.map((iv) => `${iv.start}–${iv.end}`).join(', ')
    parts.push(`${w.label} ${hours}`)
  }
  return parts.join(' · ')
}

export function serviceAvailabilityLabel(service: AccountingService): 'custom' | 'inherited' {
  return hasCustomBookingHours(service.bookingOverrides) ? 'custom' : 'inherited'
}

/** Modo do serviço numa data: herda firma, fechado, ou aberto com intervalos próprios. */
export function serviceDayModeForDate(
  service: AccountingService,
  date: string,
): 'inherit' | 'closed' | 'open' {
  const overrides = service.bookingOverrides?.dateOverrides
  if (!overrides || !Object.prototype.hasOwnProperty.call(overrides, date)) return 'inherit'
  const intervals = overrides[date]
  if (!Array.isArray(intervals) || intervals.length === 0) return 'closed'
  return 'open'
}

/**
 * Aplica Herdar / Fechado / Aberto a `bookingOverrides` de um serviço para uma data.
 * Devolve `null` quando o serviço volta a herdar tudo (sem horário próprio).
 */
export function applyServiceDayOverride(params: {
  existing: Partial<FirmBookingSettings> | null | undefined
  date: string
  mode: 'inherit' | 'closed' | 'open'
  intervals?: TimeInterval[]
}): Partial<FirmBookingSettings> | null {
  const { existing, date, mode, intervals } = params
  const base: Partial<FirmBookingSettings> =
    existing && typeof existing === 'object' ? { ...existing } : {}
  const dateOverrides: NonNullable<FirmBookingSettings['dateOverrides']> = {
    ...(base.dateOverrides && typeof base.dateOverrides === 'object' ? base.dateOverrides : {}),
  }

  if (mode === 'inherit') {
    delete dateOverrides[date]
  } else if (mode === 'closed') {
    dateOverrides[date] = []
  } else {
    const list = (intervals || []).map((iv) => ({ start: iv.start, end: iv.end }))
    dateOverrides[date] = list.length ? list : [{ start: '09:00', end: '17:00' }]
  }

  const next: Partial<FirmBookingSettings> = { ...base }
  if (Object.keys(dateOverrides).length > 0) next.dateOverrides = dateOverrides
  else delete next.dateOverrides

  const hasSchedule =
    !!next.schedule &&
    Object.values(next.schedule).some((ivs) => Array.isArray(ivs) && ivs.length > 0)
  const hasWeekdays = Array.isArray(next.weekdays) && next.weekdays.length > 0
  const hasDates = !!next.dateOverrides && Object.keys(next.dateOverrides).length > 0
  if (!hasSchedule && !hasWeekdays && !hasDates) return null
  return next
}
