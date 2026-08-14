import { describe, expect, it } from 'vitest'

import { AGENCY } from '@/shared/config/agency'
import { BRAND } from '@/shared/config/brand'
import {
  agencySocialUrl,
  mailtoSupportUrl,
  supportEmailDisplay,
  supportPhoneDisplay,
  teglionProductOfAgencyLine,
  telSupportUrl,
  whatsappSupportUrl,
} from '@/shared/config/supportLinks'

describe('supportLinks + agency identity', () => {
  it('builds WhatsApp URL from BRAND without inventing a number', () => {
    const url = whatsappSupportUrl('Olá, preciso de ajuda com o Teglion.')
    expect(url.startsWith(BRAND.phone.whatsapp)).toBe(true)
    expect(url).toContain('text=')
    expect(url).toContain(encodeURIComponent('Olá, preciso de ajuda com o Teglion.'))
  })

  it('builds mailto and tel from BRAND', () => {
    expect(mailtoSupportUrl()).toBe(
      `mailto:${BRAND.emails.support}?subject=${encodeURIComponent('Suporte Teglion')}`,
    )
    expect(telSupportUrl()).toBe(`tel:${BRAND.phone.e164}`)
    expect(supportEmailDisplay()).toBe(BRAND.emails.support)
    expect(supportPhoneDisplay()).toBe(BRAND.phone.display)
  })

  it('exposes AfDigital socials as public URLs (no /admin/)', () => {
    expect(AGENCY.socials.instagram).toBe('https://www.instagram.com/afdigitalweb/')
    expect(AGENCY.socials.facebook).toBe(
      'https://www.facebook.com/afdigitalsolucoestecnologicas',
    )
    expect(AGENCY.socials.linkedin).toBe('https://www.linkedin.com/company/137384112/')
    expect(agencySocialUrl('linkedin')).not.toContain('/admin/')
  })

  it('keeps Teglion as product and AfDigital as company', () => {
    const line = teglionProductOfAgencyLine()
    expect(line.startsWith(`${BRAND.name} ·`)).toBe(true)
    expect(line).toContain(AGENCY.productOfLabel)
    expect(AGENCY.displayName).toBe('AfDigital — Soluções Tecnológicas')
  })
})
