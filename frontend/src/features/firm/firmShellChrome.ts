/**
 * Contrato de chrome do escritório (Fase 1E Bloco 1).
 * Fonte única para classes de visibilidade — testável sem browser.
 */
export const FIRM_SHELL_BREAKPOINTS = {
  /** Tailwind md = 768px · xl = 1280px */
  mobileMaxPx: 767,
  tabletMinPx: 768,
  tabletMaxPx: 1279,
  desktopMinPx: 1280,
} as const

export const FIRM_SHELL_CHROME_CLASSES = {
  /** Visible 768–1279 */
  tabletRailAside: 'cb-firm-tablet-rail-aside hidden md:flex xl:hidden',
  /** Visible ≥1280 */
  desktopSidebarAside: 'staff-app-sidebar-aside cb-firm-sidebar-aside hidden shrink-0 xl:flex',
  /** Visible <768 */
  mobileNavHost: 'md:hidden',
  mobileTopbarHost: 'md:hidden',
  /** Visible ≥768 */
  compactTopbarHost: 'hidden md:block',
} as const

export function firmShellBandForWidth(widthPx: number): 'mobile' | 'tablet' | 'desktop' {
  if (widthPx < FIRM_SHELL_BREAKPOINTS.tabletMinPx) return 'mobile'
  if (widthPx <= FIRM_SHELL_BREAKPOINTS.tabletMaxPx) return 'tablet'
  return 'desktop'
}
