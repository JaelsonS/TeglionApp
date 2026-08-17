import { describe, expect, it } from 'vitest'

import { deadlineBucket, groupByDeadlineBucket, relativeDueLabel } from './groupClientDeadlines'

const noon = new Date('2026-08-17T12:00:00')

describe('groupClientDeadlines', () => {
  it('buckets overdue, this week and later', () => {
    expect(deadlineBucket('2026-08-10', noon)).toBe('overdue')
    expect(deadlineBucket('2026-08-17', noon)).toBe('thisWeek')
    expect(deadlineBucket('2026-08-20', noon)).toBe('thisWeek')
    expect(deadlineBucket('2026-09-01', noon)).toBe('later')
  })

  it('uses short relative labels instead of full dates', () => {
    expect(relativeDueLabel('2026-08-17', noon)).toBe('Hoje')
    expect(relativeDueLabel('2026-08-18', noon)).toBe('Amanhã')
    expect(relativeDueLabel('2026-08-16', noon)).toBe('Ontem')
  })

  it('groups items by bucket', () => {
    const grouped = groupByDeadlineBucket(
      [{ dueDate: '2026-08-10' }, { dueDate: '2026-08-18' }, { dueDate: '2026-09-01' }],
      noon,
    )
    expect(grouped.overdue).toHaveLength(1)
    expect(grouped.thisWeek).toHaveLength(1)
    expect(grouped.later).toHaveLength(1)
  })
})
