import { describe, expect, it } from 'vitest'

import {
  expectedBadgeRequestsPerWindow,
  FIRM_SHELL_BADGE_POLL_MS,
  LEGACY_BADGE_REQUESTS_PER_15MIN_FLOOR,
} from '@/features/firm/firmShellRequestBudget'
import { FIRM_NAV_BADGES_POLL_MS } from '@/features/firm/useFirmNavBadges'

describe('firm shell request budget (Gate 1)', () => {
  it('keeps badge poll aligned with anti-429 budget', () => {
    expect(FIRM_NAV_BADGES_POLL_MS).toBe(FIRM_SHELL_BADGE_POLL_MS)
  })

  it('cuts badge traffic well below legacy floor', () => {
    const next = expectedBadgeRequestsPerWindow()
    expect(next).toBeLessThanOrEqual(5)
    expect(next).toBeLessThan(LEGACY_BADGE_REQUESTS_PER_15MIN_FLOOR / 10)
  })
})
