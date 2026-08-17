import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Briefcase,
  CalendarDays,
  Home,
  Inbox,
  MessageSquare,
  MoreHorizontal,
  Settings,
  Upload,
} from 'lucide-react'

export type ClientNavBadgeKey = 'requests' | 'messages' | 'updates'

export type ClientNavItemConfig = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  badgeKey?: ClientNavBadgeKey
}

/** Barra inferior + sidebar principal. */
export const CLIENT_NAV_PRIMARY: ClientNavItemConfig[] = [
  { to: '/app/client', label: 'Início', icon: Home, end: true },
  { to: '/app/client/requests', label: 'Pedidos', icon: Inbox, badgeKey: 'requests' },
  { to: '/app/client/services', label: 'Serviços', icon: Briefcase },
  { to: '/app/client/messages', label: 'Mensagens', icon: MessageSquare, badgeKey: 'messages' },
  { to: '/app/client/more', label: 'Mais', icon: MoreHorizontal },
]

/** Destinos secundários (página Mais, rail inferior, sidebar extra). */
export const CLIENT_NAV_MORE: ClientNavItemConfig[] = [
  { to: '/app/client/agenda', label: 'Prazos', icon: CalendarDays },
  { to: '/app/client/documents', label: 'Documentos', icon: Upload },
  { to: '/app/client/updates', label: 'Avisos', icon: Bell, badgeKey: 'updates' },
  { to: '/app/client/account', label: 'Conta e ajuda', icon: Settings },
]

/** Tablet rail: atalhos principais (sem «Mais»). */
export const CLIENT_NAV_RAIL_MAIN: ClientNavItemConfig[] = CLIENT_NAV_PRIMARY.filter(
  (item) => item.to !== '/app/client/more',
)

/** Tablet rail inferior + sidebar «Mais». */
export const CLIENT_NAV_RAIL_BOTTOM: ClientNavItemConfig[] = CLIENT_NAV_MORE

export const CLIENT_NAV_ALL: ClientNavItemConfig[] = [...CLIENT_NAV_PRIMARY, ...CLIENT_NAV_MORE]

export type ClientNavBadges = Partial<Record<ClientNavBadgeKey, number>>

export function clientNavBadgeFor(
  item: ClientNavItemConfig,
  badges: ClientNavBadges,
): number | undefined {
  if (!item.badgeKey) return undefined
  const n = badges[item.badgeKey] ?? 0
  return n > 0 ? n : undefined
}

export function isClientNavItemActive(item: ClientNavItemConfig, pathname: string): boolean {
  if (item.end) return pathname === item.to || pathname === `${item.to}/`
  if (item.to === '/app/client/more') {
    return (
      pathname === item.to ||
      CLIENT_NAV_MORE.some((m) => pathname === m.to || pathname.startsWith(`${m.to}/`))
    )
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export function clientNavLabelForPath(pathname: string): string | undefined {
  const exact = CLIENT_NAV_ALL.find((item) => item.end && (pathname === item.to || pathname === `${item.to}/`))
  if (exact) return exact.label
  const hit = [...CLIENT_NAV_ALL]
    .filter((item) => !item.end && (pathname === item.to || pathname.startsWith(`${item.to}/`)))
    .sort((a, b) => b.to.length - a.to.length)[0]
  return hit?.label
}
