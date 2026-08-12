import { describe, expect, it } from 'vitest'

import { buildEventPayload, type EventFormValues } from '@/features/firm/fiscal-calendar/FiscalEventFormDialog'

function base(overrides: Partial<EventFormValues> = {}): EventFormValues {
  return {
    title: 'Entrega IVA',
    description: 'Mensal',
    notes: '',
    startDate: '2026-08-20',
    startTime: '',
    categoryId: 'cat-1',
    eventKind: 'FISCAL',
    status: 'SCHEDULED',
    priority: 'NORMAL',
    colorToken: 'violet',
    authority: 'AT',
    periodLabel: '2026-07',
    recurrenceEnabled: false,
    recurrenceFrequency: 'MONTHLY',
    recurrenceDayOfMonth: '20',
    scope: 'series',
    ...overrides,
  }
}

describe('buildEventPayload', () => {
  it('builds create payload without recurrence', () => {
    const payload = buildEventPayload(base())
    expect(payload.title).toBe('Entrega IVA')
    expect(payload.startDate).toBe('2026-08-20')
    expect(payload.recurrence).toBeNull()
    expect(payload.scope).toBe('series')
  })

  it('includes monthly recurrence when enabled', () => {
    const payload = buildEventPayload(
      base({ recurrenceEnabled: true, recurrenceFrequency: 'MONTHLY', recurrenceDayOfMonth: '20' }),
    )
    expect(payload.recurrence).toEqual({
      frequency: 'MONTHLY',
      intervalCount: 1,
      dayOfMonth: 20,
    })
  })

  it('keeps occurrence scope for single-edit', () => {
    const payload = buildEventPayload(
      base({ scope: 'occurrence', occurrenceDate: '2026-08-20', recurrenceEnabled: true }),
    )
    expect(payload.scope).toBe('occurrence')
    expect(payload.occurrenceDate).toBe('2026-08-20')
    expect(payload.recurrence).toBeUndefined()
  })
})
