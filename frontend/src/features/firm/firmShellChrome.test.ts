import { describe, expect, it } from 'vitest'
import {
  FIRM_SHELL_BREAKPOINTS,
  FIRM_SHELL_CHROME_CLASSES,
  firmShellBandForWidth,
} from './firmShellChrome'

describe('firmShellChrome', () => {
  it('maps widths to mobile / tablet / desktop bands', () => {
    expect(firmShellBandForWidth(375)).toBe('mobile')
    expect(firmShellBandForWidth(430)).toBe('mobile')
    expect(firmShellBandForWidth(767)).toBe('mobile')
    expect(firmShellBandForWidth(768)).toBe('tablet')
    expect(firmShellBandForWidth(1024)).toBe('tablet')
    expect(firmShellBandForWidth(1279)).toBe('tablet')
    expect(firmShellBandForWidth(1280)).toBe('desktop')
    expect(firmShellBandForWidth(1440)).toBe('desktop')
  })

  it('keeps breakpoint constants aligned with Tailwind md/xl', () => {
    expect(FIRM_SHELL_BREAKPOINTS.tabletMinPx).toBe(768)
    expect(FIRM_SHELL_BREAKPOINTS.desktopMinPx).toBe(1280)
  })

  it('exposes chrome visibility classes for tablet rail without bottom nav', () => {
    expect(FIRM_SHELL_CHROME_CLASSES.tabletRailAside).toContain('md:flex')
    expect(FIRM_SHELL_CHROME_CLASSES.tabletRailAside).toContain('xl:hidden')
    expect(FIRM_SHELL_CHROME_CLASSES.mobileNavHost).toBe('md:hidden')
    expect(FIRM_SHELL_CHROME_CLASSES.desktopSidebarAside).toContain('xl:flex')
  })
})
