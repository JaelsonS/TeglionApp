import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import { FirmMobileNavBar } from '@/features/firm/FirmMobileNavBar'
import { FirmSidebar } from '@/features/firm/FirmSidebar'
import { FirmTabletRail } from '@/features/firm/FirmTabletRail'
import { FirmTopbar } from '@/features/firm/FirmTopbar'
import { FIRM_SHELL_CHROME_CLASSES } from '@/features/firm/firmShellChrome'
import { FirmShellFooter } from '@/features/firm/support/FirmShellFooter'
import { MayaAssistant } from '@/features/maya'
import { PageRouteFallback } from '@/shared/components/layout/PageRouteFallback'
import { LiveEventsProvider } from '@/shared/providers/LiveEventsProvider'

/**
 * Shell do escritório (Fase 1E Bloco 1):
 * - Mobile &lt;768: topbar + main + bottom nav
 * - Tablet 768–1279: icon rail + topbar compacta + main (sem bottom nav)
 * - Desktop ≥1280: sidebar completa + topbar compacta + main
 *
 * Um único Outlet — evita dual DOM mobile/desktop.
 */
export function FirmLayout() {
  return (
    <LiveEventsProvider scope="firm">
      <div data-testid="firm-shell" className="staff-app-shell cb-firm-shell">
        {/* Tablet rail — 768–1279 */}
        <aside
          className={FIRM_SHELL_CHROME_CLASSES.tabletRailAside}
          aria-label="Navegação do escritório"
          data-testid="firm-tablet-rail-aside"
        >
          <FirmTabletRail />
        </aside>

        {/* Desktop sidebar — ≥1280 */}
        <aside
          className={FIRM_SHELL_CHROME_CLASSES.desktopSidebarAside}
          aria-label="Navegação do escritório"
          data-testid="firm-desktop-sidebar-aside"
        >
          <FirmSidebar variant="desktop" />
        </aside>

        <div className="cb-firm-main-column">
          <div className={FIRM_SHELL_CHROME_CLASSES.mobileTopbarHost}>
            <FirmTopbar />
          </div>
          <div className={FIRM_SHELL_CHROME_CLASSES.compactTopbarHost}>
            <FirmTopbar compact />
          </div>

          <main className="cb-firm-unified-main" data-testid="firm-main">
            <div className="staff-app-content-wrap cb-firm-content-wrap">
              <Suspense fallback={<PageRouteFallback />}>
                <Outlet />
              </Suspense>
            </div>
          </main>

          <div className="shrink-0 border-t border-border bg-card">
            <FirmShellFooter />
          </div>

          <div className={FIRM_SHELL_CHROME_CLASSES.mobileNavHost} data-testid="firm-mobile-nav-host">
            <FirmMobileNavBar />
          </div>
        </div>
      </div>
      <MayaAssistant />
    </LiveEventsProvider>
  )
}
