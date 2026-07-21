import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import {
  FIRM_NAV_GROUPS,
  type FirmNavGroupConfig,
  type FirmNavItemConfig,
} from '@/features/firm/firmNavConfig'
import { cn } from '@/shared/lib/utils'
import { useFirmBranding } from '@/shared/hooks/useFirmBranding'
import { contabilMessagesApi, toPublicAssetUrl } from '@/infrastructure/api'
import { onAppDataChanged } from '@/shared/utils/appEvents'
import { useAuth } from '@/shared/hooks/useAuth'
import { FirmSidebarHeader } from '@/shared/components/layout/FirmSidebarHeader'

function navTestId(to: string) {
  return `firm-sidebar-${to.replace(/\//g, '-')}`
}

const FIRM_MESSAGES_UNREAD_KEY = 'firm-messages-unread'

/** Uma única query partilhada (sidebar + mobile nav) — evita polling duplicado. */
export function useFirmMessagesUnread() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: [FIRM_MESSAGES_UNREAD_KEY, user?.id],
    queryFn: () => contabilMessagesApi.getUnreadSummary(),
    enabled: Boolean(user?.id),
    staleTime: 120_000,
    refetchInterval: (q) => {
      if (document.visibilityState !== 'visible') return false
      if (isAxiosError(q.state.error) && q.state.error.response?.status === 429) return false
      return false
    },
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 429) return false
      return failureCount < 1
    },
  })

  useEffect(() => {
    if (!user?.id) return
    return onAppDataChanged((detail) => {
      if (
        !detail.scope ||
        detail.scope === 'messages' ||
        detail.scope === 'internal-messages' ||
        detail.scope === 'document-requests' ||
        detail.scope === 'live'
      ) {
        void qc.invalidateQueries({ queryKey: [FIRM_MESSAGES_UNREAD_KEY, user.id] })
      }
    })
  }, [qc, user?.id])

  return query.data?.total ?? 0
}

function resolveBadge(item: FirmNavItemConfig, messagesUnread: number) {
  if (item.badgeKey === 'messages') return messagesUnread
  return undefined
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
  return (
    <NavLink
      data-testid={navTestId(item.to)}
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        cn('cb-firm-nav-item', isActive ? 'cb-firm-nav-item-active' : 'cb-firm-nav-item-inactive')
      }
    >
      <span className="cb-firm-nav-item-icon" aria-hidden>
        <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
      </span>
      <span className="cb-firm-nav-item-label">{label}</span>
      {badge && badge > 0 ? (
        <span className="cb-firm-nav-item-badge" aria-label={`${badge} não lidas`}>
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </NavLink>
  )
}

function NavGroup({
  group,
  labelFor,
  messagesUnread,
  onItemClick,
}: {
  group: FirmNavGroupConfig
  labelFor: (item: FirmNavItemConfig) => string
  messagesUnread: number
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
              badge={resolveBadge(item, messagesUnread)}
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
  const messagesUnread = useFirmMessagesUnread()

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
          messagesUnread={messagesUnread}
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
