import { PanelLeftOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  FIRM_NAV_RAIL_BOTTOM,
  FIRM_NAV_RAIL_MAIN,
  type FirmNavItemConfig,
} from '@/features/firm/firmNavConfig'
import { FirmRailIconButton, FirmRailIconLink } from '@/features/firm/FirmRailIconLink'
import { resolveFirmNavBadge, useFirmNavBadgeCounts } from '@/features/firm/useFirmNavBadges'
import { FirmSidebarHeader } from '@/shared/components/layout/FirmSidebarHeader'
import { useFirmBranding } from '@/shared/hooks/useFirmBranding'
import { toPublicAssetUrl } from '@/infrastructure/api'

/** Rail único (desktop) — todos os ícones no mesmo menu, tooltips em todos. */
export function FirmDesktopCollapsedRail({ onExpand }: { onExpand: () => void }) {
  const { t } = useTranslation('common')
  const { firm, firmLogoUrl } = useFirmBranding()
  const counts = useFirmNavBadgeCounts()

  const fullLogoUrl = firmLogoUrl || toPublicAssetUrl(firm?.branding?.logoUrl)
  const subtitle = t('contabil.firm.subtitle', { defaultValue: 'Escritório' })
  const fallbackName = t('contabil.firm.fallback', { defaultValue: 'Teglion' })
  const expandLabel = t('contabil.firm.nav.expandSidebar', {
    defaultValue: 'Expandir menu',
  })

  const labelFor = (item: FirmNavItemConfig) =>
    t(item.labelKey, { defaultValue: item.labelDefault })

  const allItems = [...FIRM_NAV_RAIL_MAIN, ...FIRM_NAV_RAIL_BOTTOM]

  return (
    <div className="cb-firm-icon-rail" data-testid="firm-desktop-collapsed-rail">
      <div className="cb-firm-icon-rail-brand">
        <button
          type="button"
          className="cb-firm-rail-logo"
          aria-label={expandLabel}
          title={expandLabel}
          onClick={onExpand}
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
        {allItems.map((item) => (
          <FirmRailIconLink
            key={item.to}
            item={item}
            label={labelFor(item)}
            badge={resolveFirmNavBadge(item, counts)}
            testIdPrefix="firm-desktop-rail"
          />
        ))}
        <FirmRailIconButton
          label={expandLabel}
          testId="firm-desktop-sidebar-expand"
          aria-expanded={false}
          onClick={onExpand}
        >
          <PanelLeftOpen className="cb-firm-rail-icon" strokeWidth={1.75} aria-hidden />
        </FirmRailIconButton>
      </nav>
    </div>
  )
}
