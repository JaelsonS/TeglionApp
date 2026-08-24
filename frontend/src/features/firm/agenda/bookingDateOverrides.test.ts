import { describe, expect, it } from 'vitest'

import type { BookingDateOverrides, BookingDaySchedule } from '@/shared/types/contabil'

import {
  clearDayOverride,
  cloneDateOverrides,
  copyDayOverride,
  copyMonthDateOverrides,
  dayOverrideKind,
  effectiveIntervalsForDate,
  setDayOverride,
} from './bookingDateOverrides'

describe('cloneDateOverrides', () => {
  it('clones intervals without sharing identity', () => {
    const source: BookingDateOverrides = {
      '2026-08-10': [{ start: '09:00', end: '12:00' }],
      '2026-08-15': [],
    }
    const cloned = cloneDateOverrides(source)
    expect(cloned).toEqual(source)
    cloned['2026-08-10'][0].start = '10:00'
    expect(source['2026-08-10'][0].start).toBe('09:00')
  })
})

describe('dayOverrideKind', () => {
  it('distinguishes none, closed and custom', () => {
    const overrides: BookingDateOverrides = {
      '2026-08-10': [],
      '2026-08-11': [{ start: '10:00', end: '12:00' }],
    }
    expect(dayOverrideKind('2026-08-09', overrides)).toBe('none')
    expect(dayOverrideKind('2026-08-10', overrides)).toBe('closed')
    expect(dayOverrideKind('2026-08-11', overrides)).toBe('custom')
  })
})

describe('effectiveIntervalsForDate', () => {
  const schedule: BookingDaySchedule = {
    1: [{ start: '09:00', end: '17:00' }],
  }

  it('uses weekday schedule when there is no override', () => {
    // 2026-08-10 is Monday
    expect(effectiveIntervalsForDate('2026-08-10', schedule, {})).toEqual([
      { start: '09:00', end: '17:00' },
    ])
  })

  it('closed override wins over schedule', () => {
    expect(effectiveIntervalsForDate('2026-08-10', schedule, { '2026-08-10': [] })).toEqual([])
  })

  it('custom override replaces schedule', () => {
    expect(
      effectiveIntervalsForDate('2026-08-10', schedule, {
        '2026-08-10': [{ start: '10:00', end: '12:00' }],
      }),
    ).toEqual([{ start: '10:00', end: '12:00' }])
  })
})

describe('setDayOverride / clearDayOverride / copyDayOverride', () => {
  it('sets, clears and copies a day independently', () => {
    let next = setDayOverride({}, '2026-08-10', [{ start: '09:00', end: '12:00' }])
    expect(next['2026-08-10']).toHaveLength(1)
    next = copyDayOverride(next, '2026-08-10', '2026-08-17')
    expect(next['2026-08-17']).toEqual([{ start: '09:00', end: '12:00' }])
    next['2026-08-17'][0].start = '11:00'
    expect(next['2026-08-10'][0].start).toBe('09:00')
    next = clearDayOverride(next, '2026-08-10')
    expect(dayOverrideKind('2026-08-10', next)).toBe('none')
  })
})

describe('copyMonthDateOverrides', () => {
  it('copies August exceptions to September without shared identity', () => {
    const august: BookingDateOverrides = {
      '2026-08-05': [],
      '2026-08-12': [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '17:00' },
      ],
      '2026-07-01': [{ start: '08:00', end: '09:00' }],
    }
    const next = copyMonthDateOverrides(august, '2026-08', '2026-09')
    expect(next['2026-08-05']).toEqual([])
    expect(next['2026-08-12']).toEqual([
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '17:00' },
    ])
    expect(next['2026-09-05']).toEqual([])
    expect(next['2026-09-12']).toEqual([
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '17:00' },
    ])
    expect(next['2026-07-01']).toEqual([{ start: '08:00', end: '09:00' }])

    next['2026-09-12'][0].start = '10:00'
    expect(august['2026-08-12'][0].start).toBe('09:00')
    expect(next['2026-08-12'][0].start).toBe('09:00')
  })

  it('replaces existing September keys when copying again', () => {
    const overrides: BookingDateOverrides = {
      '2026-08-01': [{ start: '09:00', end: '10:00' }],
      '2026-09-01': [],
      '2026-09-15': [{ start: '11:00', end: '12:00' }],
    }
    const next = copyMonthDateOverrides(overrides, '2026-08', '2026-09')
    expect(next['2026-09-01']).toEqual([{ start: '09:00', end: '10:00' }])
    expect(next['2026-09-15']).toBeUndefined()
  })

  it('skips days that do not exist in the target month', () => {
    const overrides: BookingDateOverrides = {
      '2026-01-31': [{ start: '09:00', end: '10:00' }],
    }
    const next = copyMonthDateOverrides(overrides, '2026-01', '2026-02')
    expect(next['2026-02-31']).toBeUndefined()
    expect(next['2026-01-31']).toEqual([{ start: '09:00', end: '10:00' }])
  })
})
