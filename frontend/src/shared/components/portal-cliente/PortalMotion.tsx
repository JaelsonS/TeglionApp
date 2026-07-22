import type { ReactNode } from 'react'

/** Animações CSS leves — sem Framer Motion (evita removeChild no React 19 / mobile). */
export function PortalFadeIn({ children, className }: { children: ReactNode; className?: string; delay?: number }) {
  return <div className={className}>{children}</div>
}

export function PortalStagger({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export function PortalStaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
