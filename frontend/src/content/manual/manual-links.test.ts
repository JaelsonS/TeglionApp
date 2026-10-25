import { describe, expect, it } from 'vitest'

import { isAllowedManualInternalHref, isSafeManualSlug } from './manual-links'
import { MANUAL_CHAPTERS } from './chapters'

describe('manual security — slugs e hrefs', () => {
  it('aceita slugs canónicos dos capítulos', () => {
    for (const ch of MANUAL_CHAPTERS) {
      expect(isSafeManualSlug(ch.slug)).toBe(true)
    }
  })

  it('rejeita slugs perigosos', () => {
    expect(isSafeManualSlug('../etc/passwd')).toBe(false)
    expect(isSafeManualSlug('a b')).toBe(false)
    expect(isSafeManualSlug('javascript:alert(1)')).toBe(false)
    expect(isSafeManualSlug('')).toBe(false)
    expect(isSafeManualSlug(null)).toBe(false)
  })

  it('aceita apenas hrefs allowlistados', () => {
    expect(isAllowedManualInternalHref('/manual')).toBe(true)
    expect(isAllowedManualInternalHref('/manual/faq')).toBe(true)
    expect(isAllowedManualInternalHref('/app/firm/payments')).toBe(true)
    expect(isAllowedManualInternalHref('/auth/firm/register')).toBe(true)
  })

  it('rejeita open redirects e schemes', () => {
    expect(isAllowedManualInternalHref('https://evil.test')).toBe(false)
    expect(isAllowedManualInternalHref('//evil.test')).toBe(false)
    expect(isAllowedManualInternalHref('/\\evil')).toBe(false)
    expect(isAllowedManualInternalHref('/app/../admin')).toBe(false)
    expect(isAllowedManualInternalHref('javascript:alert(1)')).toBe(false)
    expect(isAllowedManualInternalHref('/unknown-path')).toBe(false)
  })

  it('todos os appLink dos capítulos passam na allowlist', () => {
    for (const ch of MANUAL_CHAPTERS) {
      for (const block of ch.blocks) {
        if (block.type === 'appLink') {
          expect(isAllowedManualInternalHref(block.href), `${ch.slug} → ${block.href}`).toBe(true)
        }
      }
    }
  })
})
