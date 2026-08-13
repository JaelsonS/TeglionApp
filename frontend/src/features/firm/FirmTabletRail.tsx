import { useState } from 'react'
import { Menu } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import {
  FIRM_NAV_DRAWER_ITEMS,
  FIRM_NAV_RAIL_BOTTOM,
  FIRM_NAV_RAIL_MAIN,
  isFirmNavItemActive,
  type FirmNavItemConfig,
} from '@/features/firm/firmNavConfig'
import { FirmSidebar, useFirmMessagesUnread } from '@/features/firm/FirmSidebar'
import { FirmSidebarHeader } from '@/shared/components/layout/FirmSidebarHeader'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'
import { SheetHiddenTitle } from '@/shared/components/ui/sheet-hidden-title'
import { useFirmBranding } from '@/shared/hooks/useFirmBranding'
import { toPublicAssetUrl } from '@/infrastructure/api'
import { cn } from '@/shared/lib/utils'

function railTestId(to: string) {
  return `firm-tablet-rail-${to.replace(/\//g, '-')}`
}

function RailIconLink({
  item,
  label,
  badge,
}: {
  item: FirmNavItemConfig
  label: string
  badge?: number
}) {
  const Icon = item.icon
  const location = useLocation()
  const isActive = isFirmNavItemActive(item, location.pathname, location.search, FIRM_NAV_DRAWER_ITEMS)

  return (
    <NavLink
      to={item.to}
      end={item.end}
      data-testid={railTestId(item.to)}
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

/**
 * Rail de ícones para tablet (768–1279).
 * Drawer com labels reutiliza FirmSidebar variant="drawer".
 */
export function FirmTabletRail() {
  const { t } = useTranslation('common')
  const { firm, firmLogoUrl } = useFirmBranding()
  const messagesUnread = useFirmMessagesUnread()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const fullLogoUrl = firmLogoUrl || toPublicAssetUrl(firm?.branding?.logoUrl)
  const subtitle = t('contabil.firm.subtitle', { defaultValue: 'Escritório' })
  const fallbackName = t('contabil.firm.fallback', { defaultValue: 'Teglion' })
  const menuLabel = t('nav.menu', { defaultValue: 'Menu' })

  const labelFor = (item: FirmNavItemConfig) =>
    t(item.labelKey, { defaultValue: item.labelDefault })

  const badgeFor = (item: FirmNavItemConfig) =>
    item.badgeKey === 'messages' ? messagesUnread : undefined

  return (
    <>
      <div className="cb-firm-icon-rail" data-testid="firm-tablet-rail">
        <div className="cb-firm-icon-rail-brand">
          <button
            type="button"
            className="cb-firm-rail-logo"
            aria-label={`${menuLabel} — ${firm?.name || fallbackName}`}
            aria-expanded={drawerOpen}
            aria-controls="firm-tablet-nav-drawer"
            title={menuLabel}
            onClick={() => setDrawerOpen(true)}
          >
            <FirmSidebarHeader
              name={firm?.name}
              logoUrl={fullLogoUrl}
              subtitle={subtitle}
              fallbackName={fallbackName}
              size="sm"
            />
          </button>
        </div>

        <nav
          className="cb-firm-icon-rail-nav app-scroll"
          aria-label={t('nav.main', { defaultValue: 'Menu principal' })}
        >
          {FIRM_NAV_RAIL_MAIN.map((item) => (
            <RailIconLink
              key={item.to}
              item={item}
              label={labelFor(item)}
              badge={badgeFor(item)}
            />
          ))}
        </nav>

        <div className="cb-firm-icon-rail-bottom">
          {FIRM_NAV_RAIL_BOTTOM.map((item) => (
            <RailIconLink key={item.to} item={item} label={labelFor(item)} badge={badgeFor(item)} />
          ))}
          <button
            type="button"
            className="cb-firm-icon-nav cb-firm-icon-nav-inactive"
            aria-label={menuLabel}
            aria-expanded={drawerOpen}
            aria-controls="firm-tablet-nav-drawer"
            title={menuLabel}
            data-testid="firm-tablet-rail-menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="cb-firm-rail-icon" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          id="firm-tablet-nav-drawer"
          side="left"
          className="flex w-[min(20rem,88vw)] flex-col gap-0 p-0 sm:max-w-xs"
        >
          <SheetHiddenTitle>{menuLabel}</SheetHiddenTitle>
          <FirmSidebar variant="drawer" onItemClick={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
