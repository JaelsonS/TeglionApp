import { describe, expect, it } from 'vitest'
import { computeFirmProgress } from './firmProgress'

describe('computeFirmProgress', () => {
  it('prioritizes profile when logo is missing', () => {
    const r = computeFirmProgress({
      hasLogo: false,
      firmSlug: null,
      publicSitePublished: false,
      serviceCount: 0,
      publicServiceCount: 0,
      hasBookingSchedule: false,
      clientCount: 0,
      hasPortalInvite: false,
    })
    expect(r.nextAction?.id).toBe('profile')
    expect(r.steps.find((s) => s.id === 'profile')?.done).toBe(false)
  })

  it('does not mark public page done with slug alone', () => {
    const r = computeFirmProgress({
      hasLogo: true,
      firmSlug: 'minha-firma',
      publicSitePublished: false,
      serviceCount: 0,
      publicServiceCount: 0,
      hasBookingSchedule: false,
      clientCount: 0,
      hasPortalInvite: false,
    })
    expect(r.steps.find((s) => s.id === 'publicPage')?.done).toBe(false)
    expect(r.nextAction?.id).toBe('public-page')
  })

  it('asks for first public service after page is published', () => {
    const r = computeFirmProgress({
      hasLogo: true,
      firmSlug: 'minha-firma',
      publicSitePublished: true,
      serviceCount: 2,
      publicServiceCount: 0,
      hasBookingSchedule: false,
      clientCount: 0,
      hasPortalInvite: false,
    })
    expect(r.steps.find((s) => s.id === 'service')?.done).toBe(false)
    expect(r.nextAction?.id).toBe('service')
  })

  it('treats booking and invite as optional', () => {
    const r = computeFirmProgress({
      hasLogo: true,
      firmSlug: 'minha-firma',
      publicSitePublished: true,
      serviceCount: 1,
      publicServiceCount: 1,
      hasBookingSchedule: false,
      clientCount: 1,
      hasPortalInvite: false,
    })
    expect(r.steps.find((s) => s.id === 'booking')?.optional).toBe(true)
    expect(r.steps.find((s) => s.id === 'invite')?.optional).toBe(true)
    expect(r.canStartOperating).toBe(true)
    expect(r.nextAction?.id).toBe('booking')
  })

  it('never invents invite:false as blocking progress', () => {
    const r = computeFirmProgress({
      hasLogo: true,
      firmSlug: 'x',
      publicSitePublished: true,
      serviceCount: 1,
      publicServiceCount: 1,
      hasBookingSchedule: true,
      clientCount: 1,
      hasPortalInvite: false,
    })
    expect(r.progressPct).toBe(100)
    expect(r.nextAction?.id).toBe('ready')
  })
})
