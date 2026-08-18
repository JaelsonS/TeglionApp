import { describe, expect, it } from 'vitest'

import {
  formatObligationPeriodLabel,
  monthInputToPeriod,
  periodToMonthInput,
} from './obligationOperational'

describe('obligation period (mês + ano)', () => {
  it('keeps YYYY-MM and strips the day from YYYY-MM-DD', () => {
    expect(periodToMonthInput('2026-08')).toBe('2026-08')
    expect(periodToMonthInput('2026-08-15')).toBe('2026-08')
    expect(monthInputToPeriod('2026-10')).toBe('2026-10')
    expect(monthInputToPeriod('2026-10-01')).toBe('2026-10')
  })

  it('labels the period as full month + year', () => {
    expect(formatObligationPeriodLabel('2026-08')).toBe('Agosto 2026')
    expect(formatObligationPeriodLabel('2026-08-15')).toBe('Agosto 2026')
  })
})
