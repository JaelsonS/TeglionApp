import { BRAND } from '@/shared/config/brand'

type Props = {
  visible?: boolean
  textColor?: string
}

/**
 * Crédito discreto na Página Pública. Visível por omissão (pilotos).
 * Ocultar no futuro via entitlement `hide_teglion_branding` no backend —
 * nunca `if (plan === …)` aqui.
 */
export function TeglionPublicCredit({ visible = true, textColor }: Props) {
  if (!visible) return null
  return (
    <p
      data-testid="teglion-public-credit"
      className="px-4 py-3 text-center text-[11px] tracking-wide"
      style={textColor ? { color: textColor, opacity: 0.72 } : undefined}
    >
      <a
        href={BRAND.url}
        target="_blank"
        rel="noopener noreferrer"
        className={
          textColor
            ? 'underline-offset-2 hover:underline'
            : 'text-muted-foreground/70 underline-offset-2 hover:text-muted-foreground hover:underline'
        }
      >
        Página criada com {BRAND.name}
      </a>
    </p>
  )
}
