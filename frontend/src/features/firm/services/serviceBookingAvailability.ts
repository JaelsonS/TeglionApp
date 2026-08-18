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
  return Array.isArray(overrides.weekdays) && overrides.weekdays.length > 0
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

export function bookingOverridesFromSchedule(schedule: BookingDaySchedule): {
  weekdays: number[]
  schedule: BookingDaySchedule
} {
  return {
    weekdays: weekdaysFromSchedule(schedule),
    schedule: cloneBookingSchedule(schedule),
  }
}

export function bookingOverridesPayload(
  enabled: boolean,
  schedule: BookingDaySchedule,
): { weekdays: number[]; schedule: BookingDaySchedule } | null {
  if (!enabled) return null
  return bookingOverridesFromSchedule(schedule)
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
