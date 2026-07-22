import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  Home,
  Inbox,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Upload,
  X,
} from 'lucide-react'

import { ClientPortalSidebar, type ClientNavItem } from '@/shared/components/portal-cliente/ClientPortalSidebar'
import { useClientPortalContext } from '@/features/client/ClientPortalLayout'
import { getClientHubCopy } from '@/features/client/clientHubI18n'
import { isContabilMode } from '@/shared/config/productMode'
import { useAuth } from '@/shared/hooks/useAuth'
import { useClientPortalBellCount } from '@/shared/hooks/useClientPortalBellCount'
import { useLiveEventsContext } from '@/shared/providers/LiveEventsProvider'
import { ClientNotificationCenter } from '@/features/client/ClientNotificationCenter'
import { AgencyCredit } from '@/shared/components/agency/AgencyCredit'
import { PageRouteFallback } from '@/shared/components/layout/PageRouteFallback'
import { clientPortalContabilApi } from '@/infrastructure/api'
import { onAppDataChanged } from '@/shared/utils/appEvents'
import { releaseBodyScrollLock } from '@/shared/utils/releaseBodyScrollLock'

function buildClientNav(copy: ReturnType<typeof getClientHubCopy>): Omit<ClientNavItem, 'badge'>[] {
  return [
    { to: '/app/client', label: copy.tabs.home, icon: Home, end: true },
    { to: '/app/client/requests', label: copy.tabs.requests, icon: Inbox },
    { to: '/app/client/messages', label: copy.tabs.messages, icon: MessageSquare },
    { to: '/app/client/documents', label: copy.tabs.documents, icon: Upload },
    { to: '/app/client/agenda', label: copy.tabs.obligations, icon: CalendarDays },
    { to: '/app/client/updates', label: 'Avisos', icon: Bell },
  ]
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
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-primary">
          {(userName || userEmail || '?').slice(0, 2).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-foreground">{userName || 'Cliente'}</span>
          <span className="block truncate text-[11px] text-muted-foreground">Conta</span>
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
      <div className="border-t border-border/50 px-1 pt-2">
        <AgencyCredit surface="client" />
      </div>
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [pendingRequests, setPendingRequests] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const { firm, firmLogoUrl } = useClientPortalContext()
  const live = useLiveEventsContext()
  const hubCopy = useMemo(() => getClientHubCopy(isContabilMode() ? 'pt-PT' : 'pt-PT'), [])
  const { unreadAlerts, unreadNews } = useClientPortalBellCount(!previewMode)
  const navBase = useMemo(() => buildClientNav(hubCopy), [hubCopy])

  const refreshBadges = useCallback(async () => {
    if (previewMode) return
    try {
      const [reqRes, msgRes] = await Promise.all([
        clientPortalContabilApi.listDocumentRequests(),
        clientPortalContabilApi.getMessagesUnreadCount(),
      ])
      const pending = ((reqRes.items || []) as Array<{ status?: string }>).filter(
        (r) => String(r.status || '').toLowerCase() === 'pending',
      ).length
      setPendingRequests(pending)
      setUnreadMessages(msgRes.total ?? 0)
    } catch {
      setPendingRequests(0)
      setUnreadMessages(0)
    }
  }, [previewMode])

  useEffect(() => {
    if (previewMode) return
    void refreshBadges()
  }, [previewMode, refreshBadges, location.pathname])

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (previewMode || !drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
      requestAnimationFrame(() => releaseBodyScrollLock())
    }
  }, [previewMode, drawerOpen])

  useEffect(() => {
    if (previewMode) return
    if (live.badge?.messages != null) void refreshBadges()
  }, [previewMode, live.badge?.messages, refreshBadges])

  useEffect(() => {
    if (previewMode) return
    return onAppDataChanged((d) => {
      if (
        !d.scope ||
        d.scope === 'messages' ||
        d.scope === 'document-requests' ||
        d.scope === 'documents' ||
        d.scope === 'live'
      )
        void refreshBadges()
    })
  }, [previewMode, refreshBadges])

  const navItems: ClientNavItem[] = navBase.map((item) => {
    if (item.to === '/app/client/requests') return { ...item, badge: pendingRequests }
    if (item.to === '/app/client/messages') return { ...item, badge: unreadMessages }
    if (item.to === '/app/client/updates') return { ...item, badge: unreadAlerts + unreadNews }
    return item
  })

  async function handleLogout() {
    if (previewMode || loggingOut) return
    setLoggingOut(true)
    setDrawerOpen(false)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  function goToAccount() {
    setDrawerOpen(false)
    navigate('/app/client/account')
  }

  const sidebarFooter = (
    <ClientSidebarFooter
      previewMode={previewMode}
      loggingOut={loggingOut}
      userName={user?.fullName}
      userEmail={user?.email}
      onAccount={goToAccount}
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
    items: navItems,
    onLogout: previewMode ? undefined : handleLogout,
    loggingOut,
    footer: sidebarFooter,
    brandAction: desktopBell,
  }

  const activeLabel = navItems.find((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to),
  )?.label

  const mobileDrawer =
    !previewMode && drawerOpen ? (
      <div className="pc-drawer-root xl:hidden" role="dialog" aria-modal="true" aria-label="Menu do portal">
        <button
          type="button"
          className="pc-drawer-backdrop"
          aria-label="Fechar menu"
          onClick={() => setDrawerOpen(false)}
        />
        <aside className="pc-drawer-panel">
          <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-foreground">{firm?.name || 'Portal cliente'}</p>
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setDrawerOpen(false)}
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ClientPortalSidebar
            {...sidebarProps}
            brandAction={undefined}
            onItemClick={() => setDrawerOpen(false)}
          />
        </aside>
      </div>
    ) : null

  return (
    <div className="pc-shell">
      <aside className={previewMode ? 'pc-sidebar flex' : 'pc-sidebar'}>
        <ClientPortalSidebar {...sidebarProps} />
      </aside>

      <div className="pc-main">
        <header className="pc-topbar">
          {!previewMode ? (
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-muted xl:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}
          <div className="min-w-0 flex-1 xl:hidden">
            <p className="truncate text-sm font-semibold text-foreground">{activeLabel || firm?.name || 'Portal'}</p>
            {firm?.name && activeLabel ? (
              <p className="truncate cb-text-caption text-muted-foreground">{firm.name}</p>
            ) : null}
          </div>
          <div className="relative z-10 ml-auto flex items-center gap-1.5 sm:gap-2 xl:hidden">
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
      </div>

      {mobileDrawer}
    </div>
  )
}
