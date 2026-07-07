import { Link } from 'react-router-dom'

import { authFirmRegisterUrl } from '@/shared/constants/authPaths'

type Props = {
  compact?: boolean
  className?: string
}

export function BlogTeglionPromo({ compact = false, className = '' }: Props) {
  return (
    <aside
      className={`blog-promo blog-promo--teglion ${compact ? 'blog-promo--compact' : ''} ${className}`.trim()}
      aria-label="TegLion"
    >
      <span className="blog-promo-eyebrow">TegLion · Escritórios</span>
      <span className="blog-promo-title">Menos caos no WhatsApp, mais tempo para contabilidade</span>
      {!compact ? (
        <span className="blog-promo-body">
          Documentos, prazos fiscais e portal do cliente num só sistema. Teste grátis 14 dias, sem cartão.
        </span>
      ) : null}
      <Link to={authFirmRegisterUrl()} className="blog-promo-cta-link landing-btn-primary">
        Testar grátis 14 dias
      </Link>
    </aside>
  )
}
