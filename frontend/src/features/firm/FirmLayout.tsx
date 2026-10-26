import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { FirmDesktopCollapsedRail } from '@/features/firm/FirmDesktopCollapsedRail'
import { FirmMobileNavBar } from '@/features/firm/FirmMobileNavBar'
import { FirmSidebar } from '@/features/firm/FirmSidebar'
import { FirmTabletRail } from '@/features/firm/FirmTabletRail'
import { FirmTopbar } from '@/features/firm/FirmTopbar'
import { FIRM_SHELL_CHROME_CLASSES } from '@/features/firm/firmShellChrome'
import { FirmTrialReminderBanner } from '@/features/firm/billing/FirmTrialReminderBanner'
import { FirmShellFooter } from '@/features/firm/support/FirmShellFooter'
import { useFirmSidebarCollapsed } from '@/features/firm/useFirmSidebarCollapsed'
import { MayaAssistant } from '@/features/maya'
import { MayaSetupWizard } from '@/features/maya/setup/MayaSetupWizard'
import { FirmActivationAssistant } from '@/features/firm/activation/FirmActivationAssistant'
import { PageRouteFallback } from '@/shared/components/layout/PageRouteFallback'
import { LiveEventsProvider } from '@/shared/providers/LiveEventsProvider'
import { cn } from '@/shared/lib/utils'

/**
 * Shell do gabinete (Fase 1E Bloco 1 + UX-1):
 * - Mobile &lt;768: topbar + main + bottom nav
 * - Tablet 768–1279: icon rail + topbar compacta + main (sem bottom nav)
 * - Desktop ≥1280: sidebar completa ou rail colapsável (preferência local)
 *
 * Um único Outlet — evita dual DOM mobile/desktop.
 */
export function FirmLayout() {
  const location = useLocation()
  const { collapsed, setCollapsed } = useFirmSidebarCollapsed()
  const isPublicSiteSettings =
    location.pathname.startsWith('/app/firm/settings') &&
    new URLSearchParams(location.search).get('tab') === 'pagina-publica'
  const isSettingsRoute = location.pathname.startsWith('/app/firm/settings')

  // Menu interno de Definições fica sempre com nomes (sem colapsar).
  // O sidebar principal do gabinete continua a poder minimizar em qualquer rota.

  return (
    <LiveEventsProvider scope="firm">
      <div
        data-testid="firm-shell"
        data-sidebar-collapsed={collapsed ? '1' : '0'}
        className={cn(
          'staff-app-shell cb-firm-shell',
          collapsed && 'cb-firm-shell--sidebar-collapsed',
          isSettingsRoute && 'cb-firm-shell--settings',
        )}
      >
        {/* Tablet rail — 768–1279 */}
        <aside
          className={FIRM_SHELL_CHROME_CLASSES.tabletRailAside}
          aria-label="Navegação do gabinete"
          data-testid="firm-tablet-rail-aside"
        >
          <FirmTabletRail />
        </aside>

        {/* Desktop sidebar — ≥1280 */}
        <aside
          className={cn(
            FIRM_SHELL_CHROME_CLASSES.desktopSidebarAside,
            collapsed && 'cb-firm-sidebar-aside--collapsed',
          )}
          aria-label="Navegação do gabinete"
          data-testid="firm-desktop-sidebar-aside"
        >
          {collapsed ? (
            <FirmDesktopCollapsedRail onExpand={() => setCollapsed(false)} />
          ) : (
            <FirmSidebar variant="desktop" onCollapse={() => setCollapsed(true)} />
          )}
        </aside>

        <div className="cb-firm-main-column">
          <div className={FIRM_SHELL_CHROME_CLASSES.mobileTopbarHost}>
            <FirmTopbar />
          </div>
          <div className={FIRM_SHELL_CHROME_CLASSES.compactTopbarHost}>
            <FirmTopbar compact />
          </div>

          <FirmTrialReminderBanner />

          <main className="cb-firm-unified-main" data-testid="firm-main">
            <div className="staff-app-content-wrap cb-firm-content-wrap">
              <Suspense fallback={<PageRouteFallback />}>
                <Outlet />
              </Suspense>
            </div>
          </main>

          {isPublicSiteSettings ? null : (
            <div className="shrink-0 border-t border-border bg-card">
              <FirmShellFooter />
            </div>
          )}

          <div className={FIRM_SHELL_CHROME_CLASSES.mobileNavHost} data-testid="firm-mobile-nav-host">
            <FirmMobileNavBar />
          </div>
        </div>
      </div>

      <MayaAssistant />
      <MayaSetupWizard />
      <FirmActivationAssistant />
    </LiveEventsProvider>
  )
}
