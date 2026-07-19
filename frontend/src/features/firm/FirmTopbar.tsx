import { ChevronRight, LogOut } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { FirmNotificationCenter } from '@/features/firm/FirmNotificationCenter'
import { FirmShellUserMenu } from '@/features/firm/FirmShellUserMenu'
import { firmNavLabelForPath } from '@/features/firm/firmNavConfig'
import { useAuth } from '@/shared/hooks/useAuth'
import { useFirmBranding } from '@/shared/hooks/useFirmBranding'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

export function FirmTopbar({ compact = false }: { compact?: boolean }) {
  const { logout } = useAuth()
  const { t } = useTranslation('common')
  const { firm } = useFirmBranding()
  const location = useLocation()

  const firmName = firm?.name?.trim() || t('contabil.firm.fallback', { defaultValue: 'TegLion' })
  const pageLabel = firmNavLabelForPath(location.pathname)

  return (
    <header className={cn('staff-topbar cb-firm-topbar', compact && 'cb-firm-topbar-compact')}>
      <div className="cb-firm-topbar-inner">
        <nav className="cb-firm-topbar-crumb min-w-0 flex-1" aria-label="Contexto">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
          <span className="truncate text-sm font-semibold text-foreground">{firmName}</span>
          {pageLabel && compact && location.pathname !== '/app/firm/dashboard' ? (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
              <span className="truncate text-sm text-muted-foreground">{pageLabel}</span>
            </>
          ) : null}
        </nav>

        <div className="flex shrink-0 items-center gap-0.5">
          <FirmNotificationCenter variant="topbar" />
          <FirmShellUserMenu />
          <Button
            variant="ghost"
            size="icon"
            className="cb-firm-topbar-icon-btn hidden text-muted-foreground hover:text-foreground xl:inline-flex"
            onClick={() => logout()}
            aria-label={t('logout')}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
