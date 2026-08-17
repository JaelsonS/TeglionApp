import { Suspense, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Settings } from 'lucide-react'

import { ClientMobileNavBar } from '@/features/client/ClientMobileNavBar'
import { ClientNotificationCenter } from '@/features/client/ClientNotificationCenter'
import { ClientTabletRail } from '@/features/client/ClientTabletRail'
import { useClientPortalContext } from '@/features/client/ClientPortalLayout'
import {
  CLIENT_NAV_RAIL_BOTTOM,
  CLIENT_NAV_RAIL_MAIN,
  clientNavBadgeFor,
  clientNavLabelForPath,
  isClientNavItemActive,
  type ClientNavItemConfig,
} from '@/features/client/clientPortalNav'
import { useClientNavBadges } from '@/features/client/useClientNavBadges'
import { FIRM_SHELL_CHROME_CLASSES } from '@/features/firm/firmShellChrome'
import { AgencyCredit } from '@/shared/components/agency/AgencyCredit'
import { PageRouteFallback } from '@/shared/components/layout/PageRouteFallback'
import {
  ClientPortalSidebar,
  type ClientNavGroup,
  type ClientNavItem,
} from '@/shared/components/portal-cliente/ClientPortalSidebar'
import { useAuth } from '@/shared/hooks/useAuth'

function toSidebarItem(
  item: ClientNavItemConfig,
  pathname: string,
  badges: ReturnType<typeof useClientNavBadges>,
): ClientNavItem {
  return {
    to: item.to,
    label: item.label,
    icon: item.icon,
    end: item.end,
    badge: clientNavBadgeFor(item, badges),
    active: isClientNavItemActive(item, pathname),
  }
}

function ClientSidebarFooter({
  previewMode,
  loggingOut,
  userName,
  userEmail,
  onAccount,
  onLogout,
}: {
  previewMode: boolean
  loggingOut: boolean
  userName?: string
  userEmail?: string
  onAccount: () => void
  onLogout: () => void
}) {
  return (
    <div className="space-y-0.5">
      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onAccount}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-semibold text-brand">
          {(userName || userEmail || '?').slice(0, 2).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-foreground">{userName || 'Cliente'}</span>
          <span className="block truncate text-[11px] text-muted-foreground">Conta e ajuda</span>
        </span>
        <Settings className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      </button>
      {!previewMode ? (
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] font-medium text-destructive/90 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onLogout()}
          disabled={loggingOut}
        >
          <LogOut className="h-3.5 w-3.5" />
          {loggingOut ? 'A sair…' : 'Sair'}
        </button>
      ) : null}
    </div>
  )
}

export function ClientPortalShell({
  previewMode = false,
  children,
}: {
  previewMode?: boolean
  children?: ReactNode
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const { firm, firmLogoUrl } = useClientPortalContext()
  const badges = useClientNavBadges(!previewMode)

  const navGroups: ClientNavGroup[] = [
    {
      label: 'Principal',
      items: CLIENT_NAV_RAIL_MAIN.map((item) => toSidebarItem(item, location.pathname, badges)),
    },
    {
      label: 'Mais',
      items: CLIENT_NAV_RAIL_BOTTOM.map((item) => toSidebarItem(item, location.pathname, badges)),
    },
  ]

  async function handleLogout() {
    if (previewMode || loggingOut) return
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  const sidebarFooter = (
    <ClientSidebarFooter
      previewMode={previewMode}
      loggingOut={loggingOut}
      userName={user?.fullName}
      userEmail={user?.email}
      onAccount={() => navigate('/app/client/account')}
      onLogout={() => void handleLogout()}
    />
  )

  const desktopBell = !previewMode ? (
    <div className="hidden xl:block">
      <ClientNotificationCenter />
    </div>
  ) : null

  const sidebarProps = {
    firmName: firm?.name,
    firmLogoUrl,
    userName: user?.fullName,
    userEmail: user?.email,
    items: navGroups.flatMap((g) => g.items),
    groups: navGroups,
    onLogout: previewMode ? undefined : handleLogout,
    loggingOut,
    footer: sidebarFooter,
    brandAction: desktopBell,
  }

  const pageLabel = clientNavLabelForPath(location.pathname) || 'Portal'

  return (
    <div className="pc-shell" data-testid="client-portal-shell">
      <aside
        className={FIRM_SHELL_CHROME_CLASSES.tabletRailAside}
        aria-label="Navegação do portal"
        data-testid="client-tablet-rail-aside"
      >
        <ClientTabletRail badges={badges} />
      </aside>

      <aside
        className={previewMode ? 'pc-sidebar flex' : 'pc-sidebar'}
        aria-label="Navegação do portal"
        data-testid="client-desktop-sidebar-aside"
      >
        <ClientPortalSidebar {...sidebarProps} />
      </aside>

      <div className="pc-main">
        <header className="pc-topbar flex" data-testid="client-portal-topbar">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{pageLabel}</p>
          </div>
          <div className="relative z-10 ml-auto flex items-center gap-1.5 xl:hidden">
            {!previewMode ? <ClientNotificationCenter /> : null}
          </div>
        </header>

        <main className="pc-scroll">
          <div className="pc-content">
            {previewMode && children ? (
              children
            ) : (
              <Suspense fallback={<PageRouteFallback />}>
                <Outlet />
              </Suspense>
            )}
          </div>
        </main>

        <footer className="shrink-0 border-t border-border/60 bg-card/80 px-4 py-2 max-md:mb-[4.75rem]">
          <AgencyCredit surface="client" nameOnly />
        </footer>

        {!previewMode ? (
          <div className={FIRM_SHELL_CHROME_CLASSES.mobileNavHost} data-testid="client-mobile-nav-host">
            <ClientMobileNavBar badges={badges} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
