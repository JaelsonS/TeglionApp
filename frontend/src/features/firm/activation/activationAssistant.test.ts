import { describe, expect, it } from 'vitest'

import { computeFirmProgress } from '@/features/firm/onboarding/firmProgress'
import {
  buildActivationPhaseInput,
  resolveActivationPhase,
  resolveActivationPhaseFromProgress,
} from '@/features/firm/activation/activationAssistant'

describe('activationAssistant', () => {
  it('starts at profile without logo', () => {
    const phase = resolveActivationPhase({
      hasLogo: false,
      firmSlug: null,
      publicSitePublished: false,
      serviceCount: 0,
      publicServiceCount: 0,
      hasBookingSchedule: false,
      clientCount: 0,
      hasPortalInvite: false,
      isOwner: true,
      mayaSetupSkipped: false,
      mayaSetupApplied: false,
    })
    expect(phase.id).toBe('profile')
  })

  it('offers maya setup after profile for owners', () => {
    const phase = resolveActivationPhase({
      hasLogo: true,
      firmSlug: 'x',
      publicSitePublished: false,
      serviceCount: 0,
      publicServiceCount: 0,
      hasBookingSchedule: false,
      clientCount: 0,
      hasPortalInvite: false,
      isOwner: true,
      mayaSetupSkipped: false,
      mayaSetupApplied: false,
    })
    expect(phase.id).toBe('mayaSetup')
  })

  it('skips maya setup phase when applied or skipped', () => {
    const base = {
      hasLogo: true,
      firmSlug: 'x',
      publicSitePublished: false,
      serviceCount: 0,
      publicServiceCount: 0,
      hasBookingSchedule: false,
      clientCount: 0,
      hasPortalInvite: false,
      isOwner: true,
    }
    expect(resolveActivationPhase({ ...base, mayaSetupSkipped: true, mayaSetupApplied: false }).id).toBe(
      'publishPage',
    )
    expect(resolveActivationPhase({ ...base, mayaSetupSkipped: false, mayaSetupApplied: true }).id).toBe(
      'publishPage',
    )
  })

  it('ends at complete when all required progress steps done', () => {
    const progress = computeFirmProgress({
      hasLogo: true,
      firmSlug: 'x',
      publicSitePublished: true,
      serviceCount: 1,
      publicServiceCount: 1,
      hasBookingSchedule: false,
      clientCount: 1,
      hasPortalInvite: false,
    })
    const phase = resolveActivationPhaseFromProgress(progress, {
      firmSlug: 'x',
      isOwner: true,
      mayaSetupSkipped: true,
      mayaSetupApplied: false,
      hasAnyService: true,
      serviceCount: 1,
      publicServiceCount: 1,
    })
    expect(phase.id).toBe('complete')
  })

  it('buildActivationPhaseInput maps progress steps to signals', () => {
    const progress = computeFirmProgress({
      hasLogo: true,
      firmSlug: 'x',
      publicSitePublished: false,
      serviceCount: 2,
      publicServiceCount: 0,
      hasBookingSchedule: false,
      clientCount: 0,
      hasPortalInvite: false,
    })
    const input = buildActivationPhaseInput(progress, {
      firmSlug: 'x',
      isOwner: true,
      mayaSetupSkipped: true,
      mayaSetupApplied: false,
      hasAnyService: true,
      serviceCount: 2,
      publicServiceCount: 0,
    })
    expect(input.publicSitePublished).toBe(false)
    expect(input.serviceCount).toBe(2)
    expect(resolveActivationPhase(input).id).toBe('publishPage')
  })
})
