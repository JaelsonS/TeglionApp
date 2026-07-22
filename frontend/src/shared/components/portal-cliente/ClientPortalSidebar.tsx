import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { LogOut } from 'lucide-react'

import { SafeImage } from '@/shared/components/ui/SafeImage'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { BrandMark } from '@/shared/components/brand/BrandMark'
import { cn } from '@/shared/lib/utils'

export type ClientNavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  badge?: number
}

type Props = {
  firmName?: string
  firmLogoUrl?: string | null
  userName?: string
  userEmail?: string
  items: ClientNavItem[]
  onLogout?: () => void
  loggingOut?: boolean
  logoutLabel?: string
  footer?: ReactNode
  onItemClick?: () => void
  className?: string
  /** Slot à direita do brand (ex.: sino de notificações no desktop) */
  brandAction?: ReactNode
}

export function ClientPortalSidebar({
  firmName,
  firmLogoUrl,
  userName,
  userEmail,
  items,
  onLogout,
  loggingOut,
  logoutLabel = 'Sair',
  footer,
  onItemClick,
  className,
  brandAction,
}: Props) {
  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="pc-sidebar-brand shrink-0">
        <div className="flex items-center gap-2.5">
          {firmLogoUrl ? (
            <SafeImage
              src={firmLogoUrl}
              alt=""
              className="h-8 w-8 shrink-0 rounded-lg object-contain"
            />
          ) : (
            <BrandMark size="sm" variant="onLight" className="shrink-0 rounded-lg" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
              {firmName || 'Escritório'}
            </p>
            <p className="truncate text-[11px] leading-tight text-muted-foreground">Portal cliente</p>
          </div>
          {brandAction ? <div className="shrink-0">{brandAction}</div> : null}
        </div>
      </div>

      <nav className="flex shrink-0 flex-col gap-0.5 px-2.5 pt-3" aria-label="Navegação do portal">
        {items.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onItemClick}
            className={({ isActive }) => cn('pc-nav-item', isActive && 'pc-nav-item-active')}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <span className="flex-1 truncate">{label}</span>
            {badge && badge > 0 ? (
              <span className="pc-nav-badge">{badge > 99 ? '99+' : badge}</span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      {/* Espaço intermédio intencional — o rodapé fica ancorado em baixo, como no mockup */}
      <div className="pc-sidebar-spacer min-h-4 flex-1" aria-hidden />

      <div className="pc-sidebar-footer shrink-0">
        {footer ?? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-black/[0.04]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-primary">
                  {(userName || userEmail || '?').slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-foreground">
                    {userName || 'Cliente'}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">{userEmail}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {onLogout ? (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  disabled={loggingOut}
                  onClick={() => onLogout()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {loggingOut ? 'A sair…' : logoutLabel}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
