import { AgencyCredit } from '@/shared/components/agency/AgencyCredit'
import { cn } from '@/shared/lib/utils'

/**
 * Footer autenticado mínimo — só crédito AfDigital.
 * Informação institucional completa: Definições → Ajuda / Sobre.
 */
export function FirmShellFooter({ className }: { className?: string }) {
  return (
    <div
      className={cn('px-3 py-1.5 md:px-4', className)}
      data-testid="firm-shell-footer"
    >
      <AgencyCredit surface="firm" className="leading-snug" />
    </div>
  )
}
