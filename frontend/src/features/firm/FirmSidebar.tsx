import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import {
  FIRM_NAV_FLAT,
  FIRM_NAV_GROUPS,
  isFirmNavItemActive,
  type FirmNavGroupConfig,
  type FirmNavItemConfig,
} from '@/features/firm/firmNavConfig'
import {
  resolveFirmNavBadge,
  useFirmNavBadgeCounts,
} from '@/features/firm/useFirmNavBadges'
import { cn } from '@/shared/lib/utils'
import { useFirmBranding } from '@/shared/hooks/useFirmBranding'
import { toPublicAssetUrl } from '@/infrastructure/api'
import { FirmSidebarHeader } from '@/shared/components/layout/FirmSidebarHeader'

export {
  useFirmMessagesUnread,
  useFirmServiceInquiriesUnseen,
  FIRM_INQUIRIES_UNSEEN_QUERY_KEY,
} from '@/features/firm/useFirmNavBadges'

function navTestId(to: string) {
  return `firm-sidebar-${to.replace(/\//g, '-')}`
}

function NavItem({
  item,
  label,
  badge,
  onClick,
}: {
  item: FirmNavItemConfig
  label: string
  badge?: number
  onClick?: () => void
}) {
  const Icon = item.icon
  const location = useLocation()
  const isActive = isFirmNavItemActive(item, location.pathname, location.search, FIRM_NAV_FLAT)
  return (
    <NavLink
      data-testid={navTestId(item.to)}
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={cn('cb-firm-nav-item', isActive ? 'cb-firm-nav-item-active' : 'cb-firm-nav-item-inactive')}
    >
      <span className="cb-firm-nav-item-icon" aria-hidden>
        <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
      </span>
      <span className="cb-firm-nav-item-label">{label}</span>
      {badge && badge > 0 ? (
        <span className="cb-firm-nav-item-badge" aria-label={`${badge} por ver`}>
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </NavLink>
  )
}

function NavGroup({
  group,
  labelFor,
  counts,
  onItemClick,
}: {
  group: FirmNavGroupConfig
  labelFor: (item: FirmNavItemConfig) => string
  counts: ReturnType<typeof useFirmNavBadgeCounts>
  onItemClick?: () => void
}) {
  const { t } = useTranslation('common')
  const title = t(group.titleKey, { defaultValue: group.titleDefault })

  return (
    <div className="cb-firm-nav-group">
      <p className="cb-firm-nav-group-label">{title}</p>
      <ul className="cb-firm-nav-group-list">
        {group.items.map((item) => (
          <li key={item.to}>
            <NavItem
              item={item}
              label={labelFor(item)}
              badge={resolveFirmNavBadge(item, counts)}
              onClick={onItemClick}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Menu escritório — sidebar com labels (desktop) ou drawer (mobile). */
export function FirmSidebar({
  onItemClick,
  variant = 'drawer',
}: {
  onItemClick?: () => void
  variant?: 'drawer' | 'desktop'
}) {
  const { t } = useTranslation('common')
  const { firm, firmLogoUrl } = useFirmBranding()
  const counts = useFirmNavBadgeCounts()

  const fullLogoUrl = firmLogoUrl || toPublicAssetUrl(firm?.branding?.logoUrl)
  const subtitle = t('contabil.firm.subtitle', { defaultValue: 'Escritório' })
  const fallbackName = t('contabil.firm.fallback', { defaultValue: 'Teglion' })

  const labelFor = (item: FirmNavItemConfig) => t(item.labelKey, { defaultValue: item.labelDefault })

  const nav = (
    <nav
      className="cb-firm-sidebar-nav app-scroll"
      aria-label={t('nav.main', { defaultValue: 'Menu principal' })}
    >
      {FIRM_NAV_GROUPS.map((group) => (
        <NavGroup
          key={group.id}
          group={group}
          labelFor={labelFor}
          counts={counts}
          onItemClick={onItemClick}
        />
      ))}
    </nav>
  )

  if (variant === 'drawer') {
    return (
      <div className="flex h-full min-h-0 flex-col bg-card">
        <div className="cb-firm-sidebar-header border-b border-border/60">
          <FirmSidebarHeader
            name={firm?.name}
            logoUrl={fullLogoUrl}
            subtitle={subtitle}
            fallbackName={fallbackName}
            size="panel"
          />
        </div>
        {nav}
      </div>
    )
  }

  return (
    <div className="cb-firm-sidebar">
      <div className="cb-firm-sidebar-header">
        <FirmSidebarHeader
          name={firm?.name}
          logoUrl={fullLogoUrl}
          subtitle={subtitle}
          fallbackName={fallbackName}
          size="panel"
        />
      </div>
      {nav}
    </div>
  )
}
