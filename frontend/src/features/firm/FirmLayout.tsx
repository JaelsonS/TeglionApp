import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import { FirmMobileNavBar } from '@/features/firm/FirmMobileNavBar'
import { FirmSidebar } from '@/features/firm/FirmSidebar'
import { FirmTopbar } from '@/features/firm/FirmTopbar'
import { PageRouteFallback } from '@/shared/components/layout/PageRouteFallback'
import { LiveEventsProvider } from '@/shared/providers/LiveEventsProvider'

export function FirmLayout() {
  return (
    <LiveEventsProvider scope="firm">
      <div data-testid="firm-shell" className="staff-app-shell cb-firm-shell">
        <div className="cb-firm-mobile-shell xl:hidden">
          <FirmTopbar />
          <main className="cb-firm-mobile-main app-scroll">
            <Suspense fallback={<PageRouteFallback />}>
              <Outlet />
            </Suspense>
          </main>
          <FirmMobileNavBar />
        </div>

        <div className="cb-firm-desktop-frame">
          <aside className="staff-app-sidebar-aside cb-firm-sidebar-aside shrink-0">
            <FirmSidebar variant="desktop" />
          </aside>

          <main className="cb-firm-main">
            <FirmTopbar compact />
            <div className="cb-firm-page-host">
              <div className="staff-app-content-wrap cb-firm-content-wrap">
                <Suspense fallback={<PageRouteFallback />}>
                  <Outlet />
                </Suspense>
              </div>
            </div>
          </main>
        </div>
      </div>
    </LiveEventsProvider>
  )
}
