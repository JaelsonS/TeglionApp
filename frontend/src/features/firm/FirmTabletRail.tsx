import { useState } from 'react'
import { Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  FIRM_NAV_RAIL_BOTTOM,
  FIRM_NAV_RAIL_MAIN,
  type FirmNavItemConfig,
} from '@/features/firm/firmNavConfig'
import { FirmRailIconButton, FirmRailIconLink } from '@/features/firm/FirmRailIconLink'
import { FirmSidebar } from '@/features/firm/FirmSidebar'
import { resolveFirmNavBadge, useFirmNavBadgeCounts } from '@/features/firm/useFirmNavBadges'
import { FirmSidebarHeader } from '@/shared/components/layout/FirmSidebarHeader'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'
import { SheetHiddenTitle } from '@/shared/components/ui/sheet-hidden-title'
import { useFirmBranding } from '@/shared/hooks/useFirmBranding'
import { toPublicAssetUrl } from '@/infrastructure/api'

/**
 * Rail de ícones para tablet (768–1279).
 * Drawer com labels reutiliza FirmSidebar variant="drawer".
 */
export function FirmTabletRail() {
  const { t } = useTranslation('common')
  const { firm, firmLogoUrl } = useFirmBranding()
  const counts = useFirmNavBadgeCounts()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const fullLogoUrl = firmLogoUrl || toPublicAssetUrl(firm?.branding?.logoUrl)
  const subtitle = t('contabil.firm.subtitle', { defaultValue: 'Escritório' })
  const fallbackName = t('contabil.firm.fallback', { defaultValue: 'Teglion' })
  const menuLabel = t('nav.menu', { defaultValue: 'Menu' })

  const labelFor = (item: FirmNavItemConfig) =>
    t(item.labelKey, { defaultValue: item.labelDefault })

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
            <FirmRailIconLink
              key={item.to}
              item={item}
              label={labelFor(item)}
              badge={resolveFirmNavBadge(item, counts)}
              testIdPrefix="firm-tablet-rail"
            />
          ))}
        </nav>

        <div className="cb-firm-icon-rail-bottom">
          {FIRM_NAV_RAIL_BOTTOM.map((item) => (
            <FirmRailIconLink
              key={item.to}
              item={item}
              label={labelFor(item)}
              badge={resolveFirmNavBadge(item, counts)}
              testIdPrefix="firm-tablet-rail"
            />
          ))}
          <FirmRailIconButton
            label={menuLabel}
            testId="firm-tablet-rail-menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="cb-firm-rail-icon" strokeWidth={1.75} aria-hidden />
          </FirmRailIconButton>
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
