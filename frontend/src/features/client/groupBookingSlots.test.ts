import { describe, expect, it } from 'vitest'

import { formatSlotTime, groupBookingSlots } from './groupBookingSlots'

describe('groupBookingSlots', () => {
  it('groups consecutive slots of the same civil day', () => {
    const slots = [
      '2026-08-20T14:00:00.000Z',
      '2026-08-20T15:00:00.000Z',
      '2026-08-21T09:00:00.000Z',
    ]
    const groups = groupBookingSlots(slots, 'Europe/Lisbon')
    expect(groups).toHaveLength(2)
    expect(groups[0].slots).toHaveLength(2)
    expect(groups[1].slots).toHaveLength(1)
    expect(groups[0].heading.toLowerCase()).toContain('agosto')
  })

  it('formats only the clock for a slot', () => {
    expect(formatSlotTime('2026-08-20T14:00:00.000Z', 'Europe/Lisbon')).toMatch(/15:00/)
  })
})
