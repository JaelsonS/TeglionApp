import { ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@/shared/hooks/useAuth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { cn } from '@/shared/lib/utils'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function FirmShellUserMenu({ className }: { className?: string }) {
  const { user, logout } = useAuth()
  const { t } = useTranslation('common')
  const display = user?.fullName || user?.email || t('labels.userFallback')
  const ini = initials(display)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'cb-firm-topbar-user flex items-center gap-1 rounded-lg px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
          className,
        )}
        aria-label={t('labels.accountMenu', { defaultValue: 'Conta' })}
      >
        <span className="cb-firm-topbar-avatar" aria-hidden>
          {ini}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="border-b border-border/60 px-2 py-2">
          <p className="truncate text-sm font-medium text-foreground">{display}</p>
          {user?.email ? <p className="truncate text-xs text-muted-foreground">{user.email}</p> : null}
        </div>
        <DropdownMenuItem asChild>
          <Link to="/app/firm/settings">
            <User className="mr-2 h-4 w-4" />
            {t('labels.profile', { defaultValue: 'Perfil' })}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/app/firm/settings">
            <Settings className="mr-2 h-4 w-4" />
            {t('nav.settings', { defaultValue: 'Definições' })}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => logout()}>
          <LogOut className="mr-2 h-4 w-4" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
