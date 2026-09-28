import { describe, expect, it } from 'vitest'

import {
  canDismissTrialBanner,
  shouldShowTrialReminderBanner,
  trialBannerMessage,
  trialBannerTone,
  trialDaysRemaining,
} from '@/features/firm/billing/trialReminderUtils'

describe('trialDaysRemaining', () => {
  it('conta dias civis até ao fim inclusive', () => {
    const now = new Date(2026, 8, 28, 10, 0, 0)
    expect(trialDaysRemaining(new Date(2026, 8, 28, 23, 59, 0), now)).toBe(1)
    expect(trialDaysRemaining(new Date(2026, 9, 3, 12, 0, 0), now)).toBe(6)
  })

  it('não devolve negativos após expirar', () => {
    const now = new Date(2026, 8, 30, 10, 0, 0)
    expect(trialDaysRemaining(new Date(2026, 8, 28, 0, 0, 0), now)).toBe(0)
  })
})

describe('trialBannerTone', () => {
  it('escala urgência nos últimos dias', () => {
    expect(trialBannerTone(10)).toBe('neutral')
    expect(trialBannerTone(5)).toBe('warning')
    expect(trialBannerTone(1)).toBe('critical')
  })
})

describe('shouldShowTrialReminderBanner', () => {
  it('só mostra o banner na reta final (≤5 dias)', () => {
    expect(shouldShowTrialReminderBanner(14)).toBe(false)
    expect(shouldShowTrialReminderBanner(6)).toBe(false)
    expect(shouldShowTrialReminderBanner(5)).toBe(true)
    expect(shouldShowTrialReminderBanner(1)).toBe(true)
    expect(shouldShowTrialReminderBanner(0)).toBe(false)
  })
})

describe('canDismissTrialBanner', () => {
  it('só permite fechar quando faltam mais de 5 dias', () => {
    expect(canDismissTrialBanner(6)).toBe(true)
    expect(canDismissTrialBanner(5)).toBe(false)
    expect(canDismissTrialBanner(1)).toBe(false)
  })
})

describe('trialBannerMessage', () => {
  it('singular e plural em pt', () => {
    expect(trialBannerMessage(1, '01/10/2026')).toContain('Falta 1 dia')
    expect(trialBannerMessage(3, '04/10/2026')).toContain('Faltam 3 dias')
    expect(trialBannerMessage(0, '28/09/2026')).toContain('termina hoje')
  })
})
