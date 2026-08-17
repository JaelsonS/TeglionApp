import { AgencyNameLink } from '@/shared/components/agency/AgencyNameLink'
import { AGENCY } from '@/shared/config/agency'
import { BRAND } from '@/shared/config/brand'

type Props = {
  visible?: boolean
  textColor?: string
}

/**
 * Rodapé discreto na Página Pública (homepage + páginas de serviço).
 * Visível por omissão (pilotos). Ocultar no futuro via entitlement
 * `hide_teglion_branding` no backend — nunca `if (plan === …)` aqui.
 */
export function TeglionPublicCredit({ visible = true, textColor }: Props) {
  if (!visible) return null
  const linkClass = textColor
    ? 'font-normal underline-offset-2 hover:underline'
    : 'font-normal text-muted-foreground/70 underline-offset-2 hover:text-muted-foreground hover:underline'

  return (
    <div
      data-testid="teglion-public-credit"
      className="px-4 py-3 text-center text-[11px] tracking-wide"
      style={textColor ? { color: textColor, opacity: 0.72 } : undefined}
    >
      <p>
        <a
          href={BRAND.url}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          Página criada com {BRAND.name}
        </a>
      </p>
      <p className="mt-1">
        <AgencyNameLink className={linkClass} aria-label={`Website da ${AGENCY.displayName}`} />
      </p>
    </div>
  )
}
