import { NavLink, useLocation } from 'react-router-dom'

import {
  FIRM_NAV_DRAWER_ITEMS,
  isFirmNavItemActive,
  type FirmNavItemConfig,
} from '@/features/firm/firmNavConfig'
import { cn } from '@/shared/lib/utils'

export function firmRailTestId(to: string, prefix = 'firm-rail') {
  return `${prefix}-${to.replace(/\//g, '-')}`
}

/** Ícone do rail (tablet ou desktop colapsado). */
export function FirmRailIconLink({
  item,
  label,
  badge,
  testIdPrefix = 'firm-rail',
}: {
  item: FirmNavItemConfig
  label: string
  badge?: number
  testIdPrefix?: string
}) {
  const Icon = item.icon
  const location = useLocation()
  const isActive = isFirmNavItemActive(item, location.pathname, location.search, FIRM_NAV_DRAWER_ITEMS)

  return (
    <NavLink
      to={item.to}
      end={item.end}
      data-testid={firmRailTestId(item.to, testIdPrefix)}
      aria-label={label}
      title={label}
      className={cn(
        'cb-firm-icon-nav',
        isActive ? 'cb-firm-icon-nav-active' : 'cb-firm-icon-nav-inactive',
      )}
    >
      <span className="cb-firm-icon-nav-wrap">
        <Icon className="cb-firm-rail-icon" strokeWidth={1.75} aria-hidden />
        {badge && badge > 0 ? (
          <span className="cb-firm-rail-badge" aria-label={`${badge} não lidas`}>
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </span>
    </NavLink>
  )
}
