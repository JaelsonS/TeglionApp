import { describe, expect, it } from 'vitest'

import {
  addDaysCivil,
  civilDateToLocalDate,
  formatCivilDatePt,
  getCivilUrgency,
  localDateToCivil,
  parseCivilDate,
} from '@/shared/calendar/civilDate'
import { getFiscalUrgency } from '@/features/firm/fiscal-calendar/fiscalCalendarUtils'

describe('civilDate helpers', () => {
  it('parses YYYY-MM-DD without UTC shift', () => {
    const parts = parseCivilDate('2026-08-20')
    expect(parts).toEqual({ y: 2026, m: 8, d: 20 })
    const local = civilDateToLocalDate('2026-08-20')
    expect(local?.getFullYear()).toBe(2026)
    expect(local?.getMonth()).toBe(7)
    expect(local?.getDate()).toBe(20)
  })

  it('formats PT date from civil string', () => {
    const label = formatCivilDatePt('2026-08-20')
    expect(label).toContain('2026')
    expect(label.toLowerCase()).toContain('agosto')
  })

  it('computes urgency with civil today', () => {
    expect(getCivilUrgency('2026-08-10', '2026-08-12')).toBe('overdue')
    expect(getCivilUrgency('2026-08-15', '2026-08-12')).toBe('soon')
    expect(getCivilUrgency('2026-09-01', '2026-08-12')).toBe('upcoming')
    expect(getCivilUrgency('2026-12-01', '2026-08-12')).toBe('future')
  })

  it('getFiscalUrgency does not shift due to UTC parse', () => {
    // Simulate evening in western hemisphere: local date helpers must stay stable
    const urgency = getFiscalUrgency('2026-08-20', new Date(2026, 7, 20))
    expect(urgency).toBe('soon')
  })

  it('addDaysCivil and round-trip', () => {
    expect(addDaysCivil('2026-01-31', 1)).toBe('2026-02-01')
    const d = civilDateToLocalDate('2026-03-15')!
    expect(localDateToCivil(d)).toBe('2026-03-15')
  })
})
