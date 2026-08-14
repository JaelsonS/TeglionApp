import type { AnchorHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'> & {
  href: string
  children: ReactNode
  className?: string
}

/**
 * Link externo nativo — uma nova aba, Teglion fica aberto.
 * Sem preventDefault + window.open (evita abas duplicadas).
 */
export function ExternalLink({ href, children, className, onClick, ...rest }: ExternalLinkProps) {
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(className)}
      onClick={onClick}
      {...rest}
    >
      {children}
    </a>
  )
}
