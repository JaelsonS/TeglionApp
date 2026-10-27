import { NavLink, Outlet } from 'react-router-dom'
import {
  Activity,
  Building2,
  Bug,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Shield,
  Ban,
  ShieldAlert,
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { useAuth } from '@/shared/hooks/useAuth'

const NAV = [
  { to: '/app/ops', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/app/ops/security-lab', end: false, label: 'Lab defesa', icon: ShieldAlert },
  { to: '/app/ops/firms', end: false, label: 'Gabinetes', icon: Building2 },
  { to: '/app/ops/audit', end: false, label: 'Audit log', icon: Activity },
  { to: '/app/ops/logins', end: false, label: 'Logins / lockout', icon: KeyRound },
  { to: '/app/ops/denylist', end: false, label: 'Denylist IP', icon: Ban },
  { to: '/app/ops/sentry', end: false, label: 'Sentry', icon: Bug },
] as const

export function PlatformOpsShell() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b border-border/70 bg-card/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand" aria-hidden />
            <div>
              <p className="text-sm font-semibold tracking-tight">Teglion Control Center</p>
              <p className="text-xs text-muted-foreground">AfDigital · operações internas</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-1" aria-label="Control Center">
              {NAV.map(({ to, end, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }: { isActive: boolean }) =>
                    cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition',
                      isActive
                        ? 'bg-brand text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </NavLink>
              ))}
            </nav>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              onClick={() => {
                void logout()
              }}
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
