import { useCallback, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
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

type TooltipPos = { top: number; left: number }

/** Tooltip fixo no body — não é cortado pelo overflow do rail. */
function RailHoverTooltip({
  id,
  label,
  pos,
}: {
  id: string
  label: string
  pos: TooltipPos | null
}) {
  if (!pos || typeof document === 'undefined') return null
  return createPortal(
    <span
      id={id}
      role="tooltip"
      className="cb-firm-rail-tooltip-fixed"
      style={{ top: pos.top, left: pos.left }}
    >
      {label}
    </span>,
    document.body,
  )
}

function useRailTooltip() {
  const tooltipId = useId()
  const [pos, setPos] = useState<TooltipPos | null>(null)

  const show = useCallback((el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    setPos({ top: r.top + r.height / 2, left: r.right + 10 })
  }, [])

  const hide = useCallback(() => setPos(null), [])

  return { tooltipId, pos, show, hide }
}

/** Ícone do rail (tablet ou desktop colapsado) com tooltip no hover. */
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
  const { tooltipId, pos, show, hide } = useRailTooltip()

  return (
    <>
      <NavLink
        to={item.to}
        end={item.end}
        data-testid={firmRailTestId(item.to, testIdPrefix)}
        aria-label={label}
        aria-describedby={pos ? tooltipId : undefined}
        className={cn(
          'cb-firm-icon-nav',
          isActive ? 'cb-firm-icon-nav-active' : 'cb-firm-icon-nav-inactive',
        )}
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={hide}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={hide}
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
      <RailHoverTooltip id={tooltipId} label={label} pos={pos} />
    </>
  )
}

/** Botão do rail (expandir / menu) com o mesmo tooltip. */
export function FirmRailIconButton({
  label,
  onClick,
  testId,
  children,
  'aria-expanded': ariaExpanded,
}: {
  label: string
  onClick: () => void
  testId: string
  children: ReactNode
  'aria-expanded'?: boolean
}) {
  const { tooltipId, pos, show, hide } = useRailTooltip()

  return (
    <>
      <button
        type="button"
        className="cb-firm-icon-nav cb-firm-icon-nav-inactive"
        aria-label={label}
        aria-expanded={ariaExpanded}
        aria-describedby={pos ? tooltipId : undefined}
        data-testid={testId}
        onClick={onClick}
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={hide}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={hide}
      >
        {children}
      </button>
      <RailHoverTooltip id={tooltipId} label={label} pos={pos} />
    </>
  )
}
