import { describe, expect, it } from 'vitest'

import { cloneBookingSchedule, weekdaysFromSchedule } from './agendaCalendarUtils'

describe('booking schedule helpers', () => {
  it('clones intervals without sharing object identity', () => {
    const source = { 1: [{ start: '09:00', end: '12:00' }] }
    const cloned = cloneBookingSchedule(source)
    expect(cloned).toEqual(source)
    cloned[1]![0].start = '10:00'
    expect(source[1][0].start).toBe('09:00')
  })

  it('lists weekdays that have at least one interval', () => {
    expect(
      weekdaysFromSchedule({
        1: [{ start: '09:00', end: '12:00' }],
        2: [],
        3: [{ start: '14:00', end: '17:00' }],
      }),
    ).toEqual([1, 3])
  })
})
