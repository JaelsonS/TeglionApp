import { describe, expect, it } from 'vitest'

import {
  FIRM_NAV_BADGES_POLL_MS,
  FIRM_NAV_BADGES_STALE_MS,
  resolveFirmNavBadge,
  type FirmNavBadgeCounts,
} from '@/features/firm/useFirmNavBadges'
import type { FirmNavItemConfig } from '@/features/firm/firmNavConfig'

describe('firm nav badges polling budget', () => {
  it('poll interval is at least 3 minutes (anti-429)', () => {
    expect(FIRM_NAV_BADGES_POLL_MS).toBeGreaterThanOrEqual(180_000)
    expect(FIRM_NAV_BADGES_STALE_MS).toBeLessThanOrEqual(FIRM_NAV_BADGES_POLL_MS)
  })

  it('resolveFirmNavBadge maps keys without inventing traffic', () => {
    const counts: FirmNavBadgeCounts = {
      messages: 1,
      serviceInquiries: 2,
      consultations: 3,
      documents: 4,
      tasks: 5,
      obligations: 6,
    }
    const item = (badgeKey: FirmNavItemConfig['badgeKey']): FirmNavItemConfig =>
      ({
        to: '/',
        labelKey: 'x',
        labelDefault: 'x',
        icon: (() => null) as unknown as FirmNavItemConfig['icon'],
        badgeKey,
      }) as FirmNavItemConfig

    expect(resolveFirmNavBadge(item('messages'), counts)).toBe(1)
    expect(resolveFirmNavBadge(item('tasks'), counts)).toBe(5)
    expect(resolveFirmNavBadge(item(undefined), counts)).toBeUndefined()
  })
})
