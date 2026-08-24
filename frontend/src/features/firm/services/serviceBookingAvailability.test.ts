import { describe, expect, it } from 'vitest'

import type { BookingDaySchedule, FirmBookingSettings } from '@/shared/types/contabil'

import {
  applyServiceDayOverride,
  bookingOverridesPayload,
  computeServiceBookingOverridesPatch,
  defaultIntervalFromSchedule,
  hasCustomBookingHours,
  scheduleFromFirmBooking,
  scheduleFromServiceOverrides,
  serviceAvailabilityLabel,
  summarizeBookingSchedule,
} from './serviceBookingAvailability'

const FIRM: Pick<FirmBookingSettings, 'schedule' | 'weekdays' | 'dayStart' | 'dayEnd'> = {
  weekdays: [1, 2, 3, 4, 5],
  dayStart: '09:00',
  dayEnd: '18:00',
  schedule: {
    1: [
      { start: '09:00', end: '13:00' },
      { start: '14:00', end: '18:00' },
    ],
    2: [{ start: '09:00', end: '18:00' }],
    3: [{ start: '09:00', end: '18:00' }],
    4: [{ start: '09:00', end: '18:00' }],
    5: [{ start: '09:00', end: '18:00' }],
  },
}

describe('hasCustomBookingHours', () => {
  it('treats null and empty as inherited', () => {
    expect(hasCustomBookingHours(null)).toBe(false)
    expect(hasCustomBookingHours(undefined)).toBe(false)
    expect(hasCustomBookingHours({})).toBe(false)
  })

  it('detects weekdays, schedule or dateOverrides', () => {
    expect(hasCustomBookingHours({ weekdays: [1, 2] })).toBe(true)
    expect(hasCustomBookingHours({ schedule: { 1: [{ start: '09:00', end: '12:00' }] } })).toBe(true)
    expect(hasCustomBookingHours({ dateOverrides: { '2026-08-10': [] } })).toBe(true)
  })
})

describe('scheduleFromFirmBooking', () => {
  it('uses the real firm schedule, not a hardcoded Monday–Friday 09–17', () => {
    const schedule = scheduleFromFirmBooking(FIRM)
    expect(schedule[1]).toEqual([
      { start: '09:00', end: '13:00' },
      { start: '14:00', end: '18:00' },
    ])
    expect(schedule[5]).toEqual([{ start: '09:00', end: '18:00' }])
  })

  it('falls back to weekdays + dayStart/dayEnd when schedule is missing', () => {
    const schedule = scheduleFromFirmBooking({
      weekdays: [2],
      dayStart: '10:00',
      dayEnd: '13:00',
    })
    expect(schedule[2]).toEqual([{ start: '10:00', end: '13:00' }])
    expect(schedule[1]).toBeUndefined()
  })
})

describe('scheduleFromServiceOverrides', () => {
  it('inherits the firm schedule when there is no override', () => {
    const firm = scheduleFromFirmBooking(FIRM)
    expect(scheduleFromServiceOverrides(null, firm)).toEqual(firm)
  })

  it('keeps a custom schedule with multiple intervals and closed days', () => {
    const firm = scheduleFromFirmBooking(FIRM)
    const custom: BookingDaySchedule = {
      1: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '17:00' },
      ],
    }
    const next = scheduleFromServiceOverrides({ schedule: custom, weekdays: [1] }, firm)
    expect(next[1]).toHaveLength(2)
    expect(next[2]).toBeUndefined()
  })

  it('filters the firm schedule when only weekdays are overridden', () => {
    const firm = scheduleFromFirmBooking(FIRM)
    const next = scheduleFromServiceOverrides({ weekdays: [2] }, firm)
    expect(Object.keys(next).map(Number)).toEqual([2])
    expect(next[2]).toEqual([{ start: '09:00', end: '18:00' }])
  })
})

describe('bookingOverridesPayload', () => {
  it('sends null when customization is off', () => {
    expect(bookingOverridesPayload(false, { 1: [{ start: '09:00', end: '12:00' }] })).toBeNull()
  })

  it('sends only schedule and weekdays when on', () => {
    const payload = bookingOverridesPayload(true, {
      1: [{ start: '09:00', end: '12:00' }],
      3: [{ start: '14:00', end: '17:00' }],
    })
    expect(payload).toEqual({
      weekdays: [1, 3],
      schedule: {
        1: [{ start: '09:00', end: '12:00' }],
        3: [{ start: '14:00', end: '17:00' }],
      },
    })
  })
})

describe('computeServiceBookingOverridesPatch', () => {
  it('regressão: guardar o editor completo do serviço não apaga excepções por data já configuradas na Agenda', () => {
    // Um serviço com horário próprio E uma excepção de dia guardada via
    // AgendaServiceHoursPanel — exactamente o estado que existia quando o bug
    // foi encontrado (ServiceFullEditorSheet mandava bookingOverrides sem
    // dateOverrides, e o backend substitui a coluna inteira).
    const savedOnAgenda = {
      weekdays: [1, 2],
      schedule: {
        1: [{ start: '09:00', end: '12:00' }],
        2: [{ start: '09:00', end: '12:00' }],
      },
      dateOverrides: { '2026-09-07': [] as { start: string; end: string }[] },
    }
    const patch = computeServiceBookingOverridesPatch(savedOnAgenda)
    expect(patch?.dateOverrides).toEqual({ '2026-09-07': [] })
    expect(patch?.schedule).toEqual(savedOnAgenda.schedule)
  })

  it('sem personalização, devolve null (limpa bookingOverrides, comportamento inalterado)', () => {
    expect(computeServiceBookingOverridesPatch(null)).toBeNull()
    expect(computeServiceBookingOverridesPatch({})).toBeNull()
  })

  it('personalização só com weekdays (sem schedule) também preserva dateOverrides', () => {
    const patch = computeServiceBookingOverridesPatch({
      weekdays: [3],
      dateOverrides: { '2026-09-10': [{ start: '10:00', end: '11:00' }] },
    })
    expect(patch).toEqual({
      weekdays: [3],
      dateOverrides: { '2026-09-10': [{ start: '10:00', end: '11:00' }] },
    })
  })

  it('sem dateOverrides guardado, não inventa nenhum', () => {
    const patch = computeServiceBookingOverridesPatch({
      weekdays: [1],
      schedule: { 1: [{ start: '09:00', end: '12:00' }] },
    })
    expect(patch?.dateOverrides).toBeUndefined()
  })
})

describe('summarizeBookingSchedule', () => {
  it('describes open days for the accountant', () => {
    expect(
      summarizeBookingSchedule({
        1: [{ start: '09:00', end: '12:00' }],
        3: [{ start: '14:00', end: '17:00' }],
      }),
    ).toBe('Seg 09:00–12:00 · Qua 14:00–17:00')
  })
})

describe('defaultIntervalFromSchedule', () => {
  it('takes the first real firm interval', () => {
    expect(defaultIntervalFromSchedule(scheduleFromFirmBooking(FIRM))).toEqual({
      start: '09:00',
      end: '13:00',
    })
  })
})

describe('serviceAvailabilityLabel', () => {
  it('marks inherited vs custom', () => {
    expect(serviceAvailabilityLabel({ id: 'a', name: 'A', durationMinutes: 60, priceCents: 0 })).toBe('inherited')
    expect(
      serviceAvailabilityLabel({
        id: 'b',
        name: 'B',
        durationMinutes: 60,
        priceCents: 0,
        bookingOverrides: { weekdays: [1] },
      }),
    ).toBe('custom')
  })
})

describe('applyServiceDayOverride', () => {
  it('fecha um dia sem apagar schedule existente', () => {
    const next = applyServiceDayOverride({
      existing: {
        weekdays: [1],
        schedule: { 1: [{ start: '09:00', end: '12:00' }] },
      },
      date: '2026-08-25',
      mode: 'closed',
    })
    expect(next?.dateOverrides?.['2026-08-25']).toEqual([])
    expect(next?.schedule?.[1]).toEqual([{ start: '09:00', end: '12:00' }])
  })

  it('herdar remove a data e devolve null se não resta nada', () => {
    const next = applyServiceDayOverride({
      existing: { dateOverrides: { '2026-08-25': [] } },
      date: '2026-08-25',
      mode: 'inherit',
    })
    expect(next).toBeNull()
  })
})
