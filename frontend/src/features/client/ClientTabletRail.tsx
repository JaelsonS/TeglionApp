import { NavLink, useLocation } from 'react-router-dom'

import {
  CLIENT_NAV_RAIL_BOTTOM,
  CLIENT_NAV_RAIL_MAIN,
  clientNavBadgeFor,
  isClientNavItemActive,
  type ClientNavBadges,
  type ClientNavItemConfig,
} from '@/features/client/clientPortalNav'
import { useClientPortalContext } from '@/features/client/ClientPortalLayout'
import { FirmSidebarHeader } from '@/shared/components/layout/FirmSidebarHeader'
import { cn } from '@/shared/lib/utils'

function railTestId(to: string) {
  return `client-tablet-rail-${to.replace(/\//g, '-')}`
}

function RailIconLink({
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
      data-testid={railTestId(item.to)}
      aria-label={item.label}
      title={item.label}
      aria-current={isActive ? 'page' : undefined}
      className={cn('cb-firm-icon-nav', isActive ? 'cb-firm-icon-nav-active' : 'cb-firm-icon-nav-inactive')}
    >
      <span className="cb-firm-icon-nav-wrap">
        <Icon className="cb-firm-rail-icon" strokeWidth={1.75} aria-hidden />
        {badge && badge > 0 ? (
          <span className="cb-firm-rail-badge" aria-label={`${badge} por tratar`}>
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </span>
    </NavLink>
  )
}

/** Rail de ícones para tablet (768–1279). */
export function ClientTabletRail({ badges }: { badges: ClientNavBadges }) {
  const { firm, firmLogoUrl } = useClientPortalContext()

  return (
    <div className="cb-firm-icon-rail" data-testid="client-tablet-rail">
      <div className="cb-firm-icon-rail-brand">
        <div className="cb-firm-rail-logo" title={firm?.name || 'Portal cliente'}>
          <FirmSidebarHeader
            name={firm?.name}
            logoUrl={firmLogoUrl}
            subtitle="Portal cliente"
            fallbackName="Portal"
            size="sm"
          />
        </div>
      </div>

      <nav className="cb-firm-icon-rail-nav app-scroll" aria-label="Navegação do portal">
        {CLIENT_NAV_RAIL_MAIN.map((item) => (
          <RailIconLink key={item.to} item={item} badge={clientNavBadgeFor(item, badges)} />
        ))}
      </nav>

      <div className="cb-firm-icon-rail-bottom">
        {CLIENT_NAV_RAIL_BOTTOM.map((item) => (
          <RailIconLink key={item.to} item={item} badge={clientNavBadgeFor(item, badges)} />
        ))}
      </div>
    </div>
  )
}
