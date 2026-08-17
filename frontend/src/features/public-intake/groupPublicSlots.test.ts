import { describe, expect, it } from 'vitest'

import { formatSlotTime, groupSlotsByDay, slotDayKey } from './groupPublicSlots'

describe('groupPublicSlots', () => {
  it('groups two hours of the same Lisbon day together', () => {
    const slots = ['2026-08-18T08:00:00.000Z', '2026-08-18T09:30:00.000Z']
    const groups = groupSlotsByDay(slots)
    expect(groups).toHaveLength(1)
    expect(groups[0].dateKey).toBe('2026-08-18')
    expect(groups[0].slots).toEqual(slots)
  })

  it('splits slots that fall on different Lisbon calendar days', () => {
    const groups = groupSlotsByDay(['2026-08-18T22:30:00.000Z', '2026-08-18T23:30:00.000Z'])
    expect(groups.map((g) => g.dateKey)).toEqual(['2026-08-18', '2026-08-19'])
  })

  it('formats times in Europe/Lisbon', () => {
    expect(formatSlotTime('2026-08-18T08:00:00.000Z')).toMatch(/09:00/)
    expect(slotDayKey('2026-08-18T08:00:00.000Z')).toBe('2026-08-18')
  })

  it('ignores empty values', () => {
    expect(groupSlotsByDay(['', '2026-08-18T08:00:00.000Z'])).toHaveLength(1)
  })
})
