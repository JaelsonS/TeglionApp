import { NavLink, useLocation } from 'react-router-dom'

import {
  CLIENT_NAV_PRIMARY,
  clientNavBadgeFor,
  isClientNavItemActive,
  type ClientNavBadges,
  type ClientNavItemConfig,
} from '@/features/client/clientPortalNav'
import { cn } from '@/shared/lib/utils'

function navTestId(to: string) {
  return `client-mobile-nav-${to.replace(/\//g, '-')}`
}

function MobileNavItem({
  item,
  badge,
}: {
  item: ClientNavItemConfig
  badge?: number
}) {
  const Icon = item.icon
  const location = useLocation()
  const isActive = isClientNavItemActive(item, location.pathname)

  return (
    <NavLink
      to={item.to}
      end={item.end}
      data-testid={navTestId(item.to)}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      className={cn('cb-firm-mobile-nav-item', isActive && 'cb-firm-mobile-nav-item-active')}
    >
      <span className="cb-firm-mobile-nav-icon-wrap">
        <Icon className="cb-firm-mobile-nav-icon" strokeWidth={1.75} aria-hidden />
        {badge && badge > 0 ? (
          <span className="cb-firm-mobile-nav-badge">{badge > 9 ? '9+' : badge}</span>
        ) : null}
      </span>
      <span className="cb-firm-mobile-nav-label">{item.label}</span>
    </NavLink>
  )
}

export function ClientMobileNavBar({ badges }: { badges: ClientNavBadges }) {

  return (
    <nav className="cb-firm-mobile-nav" aria-label="Menu principal do portal" data-testid="client-mobile-nav">
      {CLIENT_NAV_PRIMARY.map((item) => (
        <MobileNavItem key={item.to} item={item} badge={clientNavBadgeFor(item, badges)} />
      ))}
    </nav>
  )
}
