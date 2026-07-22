import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/shared/lib/utils'

export type MobileBottomNavItem = {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

export function MobileBottomNav({ items }: { items: MobileBottomNavItem[] }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-md justify-around px-2 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex min-w-[4.5rem] flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
