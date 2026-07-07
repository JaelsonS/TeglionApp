import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import {
  FIRM_NAV_MOBILE_MORE,
  FIRM_NAV_MOBILE_PRIMARY,
  type FirmNavItemConfig,
} from '@/features/firm/firmNavConfig'
import { useFirmMessagesUnread } from '@/features/firm/FirmSidebar'
import { cn } from '@/shared/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'

function navTestId(to: string) {
  return `firm-mobile-nav-${to.replace(/\//g, '-')}`
}

function MobileNavItem({
  item,
  label,
  badge,
  onNavigate,
}: {
  item: FirmNavItemConfig
  label: string
  badge?: number
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      data-testid={navTestId(item.to)}
      aria-label={label}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn('cb-firm-mobile-nav-item', isActive && 'cb-firm-mobile-nav-item-active')
      }
    >
      <span className="cb-firm-mobile-nav-icon-wrap">
        <Icon className="cb-firm-mobile-nav-icon" strokeWidth={1.75} aria-hidden />
        {badge && badge > 0 ? (
          <span className="cb-firm-mobile-nav-badge">{badge > 9 ? '9+' : badge}</span>
        ) : null}
      </span>
      <span className="cb-firm-mobile-nav-label">{label}</span>
    </NavLink>
  )
}

function MoreGridItem({
  item,
  label,
  badge,
  onNavigate,
}: {
  item: FirmNavItemConfig
  label: string
  badge?: number
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      data-testid={navTestId(item.to)}
      aria-label={label}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn('cb-firm-mobile-more-item', isActive && 'cb-firm-mobile-more-item-active')
      }
    >
      <span className="relative">
        <Icon className="cb-firm-mobile-more-icon" strokeWidth={1.65} aria-hidden />
        {badge && badge > 0 ? (
          <span className="cb-firm-mobile-nav-badge">{badge > 9 ? '9+' : badge}</span>
        ) : null}
      </span>
      <span className="max-w-full truncate text-center">{label}</span>
    </NavLink>
  )
}

export function FirmMobileNavBar() {
  const { t } = useTranslation('common')
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const messagesUnread = useFirmMessagesUnread()

  const labelFor = (item: FirmNavItemConfig) =>
    t(item.labelKey, { defaultValue: item.labelDefault })

  const badgeFor = (item: FirmNavItemConfig) =>
    item.badgeKey === 'messages' ? messagesUnread : undefined

  const moreActive = FIRM_NAV_MOBILE_MORE.some((item) => {
    if (location.pathname === item.to) return true
    if (item.end === false) return location.pathname.startsWith(`${item.to}/`)
    return false
  })

  return (
    <>
      <nav className="cb-firm-mobile-nav" aria-label={t('nav.main', { defaultValue: 'Menu principal' })}>
        {FIRM_NAV_MOBILE_PRIMARY.map((item) => (
          <MobileNavItem
            key={item.to}
            item={item}
            label={labelFor(item)}
            badge={badgeFor(item)}
          />
        ))}
        <button
          type="button"
          className={cn('cb-firm-mobile-nav-item', moreActive && 'cb-firm-mobile-nav-item-active')}
          onClick={() => setMoreOpen(true)}
          aria-label={t('nav.more', { defaultValue: 'Mais opções' })}
        >
          <span className="cb-firm-mobile-nav-icon-wrap">
            <MoreHorizontal className="cb-firm-mobile-nav-icon" strokeWidth={1.75} />
          </span>
          <span className="cb-firm-mobile-nav-label">{t('nav.more', { defaultValue: 'Mais' })}</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="cb-firm-mobile-more-sheet rounded-t-2xl">
          <SheetHeader className="border-b border-border/60 px-4 py-3 text-left">
            <SheetTitle className="text-sm font-semibold">
              {t('nav.moreMenu', { defaultValue: 'Mais módulos' })}
            </SheetTitle>
          </SheetHeader>
          <nav
            className="cb-firm-mobile-more-grid"
            aria-label={t('nav.more', { defaultValue: 'Mais opções' })}
          >
            {FIRM_NAV_MOBILE_MORE.map((item) => (
              <MoreGridItem
                key={item.to}
                item={item}
                label={labelFor(item)}
                badge={badgeFor(item)}
                onNavigate={() => setMoreOpen(false)}
              />
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
