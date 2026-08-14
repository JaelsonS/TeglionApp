import { Link } from 'react-router-dom'

import { AgencyCredit } from '@/shared/components/agency/AgencyCredit'
import { teglionProductOfAgencyLine } from '@/shared/config/supportLinks'
import { cn } from '@/shared/lib/utils'

const FOOTER_LINKS = [
  { to: '/app/firm/ajuda', label: 'Ajuda e suporte' },
  { to: '/app/firm/sobre', label: 'Sobre o Teglion' },
  { to: '/privacidade', label: 'Privacidade' },
  { to: '/termos', label: 'Termos' },
] as const

/**
 * Footer discreto do shell firm — identidade + atalhos institucionais.
 * Não polui o menu principal.
 */
export function FirmShellFooter({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1.5 px-3 py-2 text-center md:px-4',
        className,
      )}
      data-testid="firm-shell-footer"
    >
      <p className="text-[11px] leading-relaxed text-muted-foreground">{teglionProductOfAgencyLine()}</p>
      <nav
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground"
        aria-label="Links institucionais"
      >
        {FOOTER_LINKS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <AgencyCredit surface="firm" />
    </div>
  )
}
