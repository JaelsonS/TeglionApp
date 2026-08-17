import { describe, expect, it } from 'vitest'

import { pickClientNextStep } from './pickClientNextStep'

describe('pickClientNextStep', () => {
  it('prioritises overdue deadlines over everything else', () => {
    const step = pickClientNextStep({
      overdueCount: 2,
      pendingRequestsCount: 5,
      unreadMessagesCount: 3,
      dueThisWeekCount: 1,
    })
    expect(step.id).toBe('overdue')
    expect(step.to).toBe('/app/client/agenda')
    expect(step.tone).toBe('critical')
  })

  it('falls through to an all-clear services prompt', () => {
    const step = pickClientNextStep({
      overdueCount: 0,
      pendingRequestsCount: 0,
      unreadMessagesCount: 0,
      dueThisWeekCount: 0,
    })
    expect(step.id).toBe('clear')
    expect(step.to).toBe('/app/client/services')
    expect(step.tone).toBe('ok')
  })
})
