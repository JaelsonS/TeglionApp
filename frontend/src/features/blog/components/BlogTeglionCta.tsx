import { Link } from 'react-router-dom'

import { authClientLoginUrl, authFirmRegisterUrl } from '@/shared/constants/authPaths'
import type { BlogBlock } from '@/content/blog/types'

type Props = {
  block: Extract<BlogBlock, { type: 'teglionCta' }>
}

export function BlogTeglionCta({ block }: Props) {
  const isFirm = block.variant === 'firm'
  const title =
    block.title ??
    (isFirm ? 'Gerir um escritório de contabilidade?' : 'Trabalha com um escritório de contabilidade?')
  const text =
    block.text ??
    (isFirm
      ? 'Documentos, prazos, portal do cliente e mensagens num só sistema. Teste 14 dias grátis.'
      : 'Peça ao seu contador um portal seguro para enviar documentos — sem WhatsApp perdido.')

  return (
    <aside className="blog-teglion-cta" aria-label="Teglion">
      <p className="blog-teglion-cta-label">Teglion</p>
      <h3 className="blog-teglion-cta-title">{title}</h3>
      <p className="blog-teglion-cta-text">{text}</p>
      <Link
        to={isFirm ? authFirmRegisterUrl() : authClientLoginUrl()}
        className="landing-btn-primary mt-4 inline-flex text-sm"
      >
        {isFirm ? 'Testar grátis 14 dias' : 'Entrar no portal cliente'}
      </Link>
    </aside>
  )
}
