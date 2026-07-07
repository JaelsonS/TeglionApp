import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Archive,
  Bell,
  CalendarCheck,
  Home,
  Inbox,
  LogOut,
  Menu,
  MessageSquare,
  Newspaper,
  Upload,
  Wallet,
  X,
} from 'lucide-react'

import { ClientPortalSidebar, type ClientNavItem } from '@/shared/components/portal-cliente/ClientPortalSidebar'
import { MobileBottomNav } from '@/shared/design-system/MobileBottomNav'
import { useClientPortalContext } from '@/features/client/ClientPortalLayout'
import { getClientHubCopy } from '@/features/client/clientHubI18n'
import { isContabilMode } from '@/shared/config/productMode'
import { useAuth } from '@/shared/hooks/useAuth'
import { useClientPortalBellCount } from '@/shared/hooks/useClientPortalBellCount'
import { useLiveEventsContext } from '@/shared/providers/LiveEventsProvider'
import { ClientNotificationCenter } from '@/features/client/ClientNotificationCenter'
import { PageRouteFallback } from '@/shared/components/layout/PageRouteFallback'
import { clientPortalContabilApi } from '@/infrastructure/api'
import { onAppDataChanged } from '@/shared/utils/appEvents'

const NAV_MOBILE_ROUTES = [
  '/app/client',
  '/app/client/requests',
  '/app/client/messages',
  '/app/client/documents',
  '/app/client/alerts',
] as const

function buildClientNav(copy: ReturnType<typeof getClientHubCopy>): Omit<ClientNavItem, 'badge'>[] {
  return [
    { to: '/app/client', label: copy.tabs.home, icon: Home, end: true },
    { to: '/app/client/requests', label: copy.tabs.requests, icon: Inbox },
    { to: '/app/client/messages', label: copy.tabs.messages, icon: MessageSquare },
    { to: '/app/client/documents', label: copy.tabs.documents, icon: Upload },
    { to: '/app/client/agenda', label: copy.tabs.obligations, icon: Wallet },
    { to: '/app/client/alerts', label: copy.tabs.alerts, icon: Bell },
    { to: '/app/client/news', label: copy.tabs.news, icon: Newspaper },
    { to: '/app/client/booking', label: copy.tabs.booking, icon: CalendarCheck },
    { to: '/app/client/archive', label: copy.tabs.archive, icon: Archive },
  ]
}

export function ClientPortalShell({
  previewMode = false,
  children,
}: {
  previewMode?: boolean
  children?: ReactNode
}) {
  const location = useLocation()
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
  const navMobilePrimary = useMemo(
    () => navBase.filter((n) => (NAV_MOBILE_ROUTES as readonly string[]).includes(n.to)),
    [navBase],
  )

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
    if (item.to === '/app/client/alerts') return { ...item, badge: unreadAlerts }
    if (item.to === '/app/client/news') return { ...item, badge: unreadNews }
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

  const sidebarProps = {
    firmName: firm?.name,
    firmLogoUrl,
    userName: user?.fullName,
    userEmail: user?.email,
    items: navItems,
    onLogout: previewMode ? undefined : handleLogout,
    loggingOut,
  }

  const activeLabel = navItems.find((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to),
  )?.label

  return (
    <motion.div className="pc-shell" initial={false} animate={{ opacity: 1 }}>
      <aside className={previewMode ? 'pc-sidebar flex' : 'pc-sidebar'}>
        <ClientPortalSidebar {...sidebarProps} />
      </aside>

      {!previewMode ? (
        <AnimatePresence>
          {drawerOpen ? (
            <>
              <motion.button
                type="button"
                className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                aria-label="Fechar menu"
                onClick={() => setDrawerOpen(false)}
              />
              <motion.aside
                className="fixed inset-y-0 left-0 z-50 flex w-[min(100%,280px)] flex-col bg-card shadow-lg lg:hidden"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">Portal cliente</p>
                  <button
                    type="button"
                    className="rounded-[10px] p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Fechar menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <ClientPortalSidebar {...sidebarProps} onItemClick={() => setDrawerOpen(false)} />
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>
      ) : null}

      <div className="pc-main">
        <header className="pc-topbar">
          {!previewMode ? (
            <button
              type="button"
              className="hidden rounded-[10px] p-2 hover:bg-muted lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}
          <div className="min-w-0 flex-1 lg:hidden">
            <p className="truncate text-sm font-semibold text-foreground">{activeLabel || firm?.name || 'Portal'}</p>
            {firm?.name && activeLabel ? (
              <p className="truncate cb-text-caption text-muted-foreground">{firm.name}</p>
            ) : null}
          </div>
          <div className="relative z-10 ml-auto flex items-center gap-2">
            {!previewMode ? <ClientNotificationCenter /> : null}
            {!previewMode ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  void handleLogout()
                }}
                disabled={loggingOut}
                aria-label="Terminar sessão"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{loggingOut ? 'A sair…' : 'Sair'}</span>
              </button>
            ) : null}
          </div>
        </header>

        <main className="pc-scroll">
          <div className="pc-content pc-content-with-mobile-nav">
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

      {!previewMode ? (
        <div className="lg:hidden">
          <MobileBottomNav
            items={navMobilePrimary.map((item) => {
              const Icon = item.icon
              const badge =
                item.to === '/app/client/requests'
                  ? pendingRequests
                  : item.to === '/app/client/messages'
                    ? unreadMessages
                    : item.to === '/app/client/alerts'
                      ? unreadAlerts
                      : item.to === '/app/client/news'
                        ? unreadNews
                        : 0
              return {
                to: item.to,
                label: item.label,
                icon: (
                  <span className="relative">
                    <Icon className="h-5 w-5" aria-hidden />
                    {badge > 0 ? (
                      <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-caption font-bold text-primary-foreground">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    ) : null}
                  </span>
                ),
              }
            })}
          />
        </div>
      ) : null}
    </motion.div>
  )
}
