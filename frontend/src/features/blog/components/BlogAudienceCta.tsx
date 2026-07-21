import { Link } from 'react-router-dom'

import type { BlogAudience, BlogPostMeta } from '@/content/blog/types'
import { resolvePostAudience } from '@/content/blog/blog-filters'
import { blogPostUrl } from '@/content/blog/blog-paths'
import { authFirmRegisterUrl } from '@/shared/constants/authPaths'

type Props = {
  post: BlogPostMeta
  compact?: boolean
}

export function BlogAudienceCta({ post, compact = false }: Props) {
  const audience = resolvePostAudience(post)

  if (audience === 'escritorio') {
    return (
      <aside className={compact ? 'blog-rail-card' : 'blog-audience-cta'} aria-label="Para escritórios">
        <p className="blog-rail-eyebrow">Escritórios</p>
        <h2 className={compact ? 'blog-rail-title' : 'blog-audience-cta-title'}>
          Organize clientes, documentos e prazos
        </h2>
        <p className={compact ? 'blog-rail-text' : 'blog-audience-cta-text'}>
          Portal do cliente, validações e calendário fiscal num só sítio. Teste 14 dias grátis, sem cartão.
        </p>
        <Link to={authFirmRegisterUrl()} className="landing-btn-primary mt-3 inline-flex text-sm">
          Testar Teglion grátis
        </Link>
      </aside>
    )
  }

  if (audience === 'estudante') {
    return (
      <aside className={compact ? 'blog-rail-card' : 'blog-audience-cta'} aria-label="Para estudantes">
        <p className="blog-rail-eyebrow">Carreira OCC</p>
        <h2 className={compact ? 'blog-rail-title' : 'blog-audience-cta-title'}>Continuar a estudar com método</h2>
        <p className={compact ? 'blog-rail-text' : 'blog-audience-cta-text'}>
          Siga a trilha de estudantes e guarde a newsletter — guias práticos sem jargão inútil.
        </p>
        <Link to="/blog?audience=estudante" className="landing-btn-primary mt-3 inline-flex text-sm">
          Ver artigos para estudantes
        </Link>
      </aside>
    )
  }

  if (audience === 'pme') {
    return (
      <aside className={compact ? 'blog-rail-card' : 'blog-audience-cta'} aria-label="Para PME">
        <p className="blog-rail-eyebrow">PME / Lda</p>
        <h2 className={compact ? 'blog-rail-title' : 'blog-audience-cta-title'}>Precisa de um escritório digital?</h2>
        <p className={compact ? 'blog-rail-text' : 'blog-audience-cta-text'}>
          Peça ao seu contabilista um portal estruturado — ou partilhe este guia com o escritório.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to={blogPostUrl('como-escolher-contabilista-portugal')} className="landing-btn-primary inline-flex text-sm">
            Como escolher contabilista
          </Link>
          <Link to={authFirmRegisterUrl()} className="blog-btn-secondary inline-flex text-sm">
            Sou escritório
          </Link>
        </div>
      </aside>
    )
  }

  return (
    <aside className={compact ? 'blog-rail-card' : 'blog-audience-cta'} aria-label="Para independentes">
      <p className="blog-rail-eyebrow">Independentes</p>
      <h2 className={compact ? 'blog-rail-title' : 'blog-audience-cta-title'}>Checklist prático + próximo passo</h2>
      <p className={compact ? 'blog-rail-text' : 'blog-audience-cta-text'}>
        Organize obrigações e, se precisar de apoio, saiba o que exigir a um contabilista OCC.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href="#blog-lead-magnet" className="landing-btn-primary inline-flex text-sm">
          Pedir checklist por e-mail
        </a>
        <Link to={blogPostUrl('como-escolher-contabilista-portugal')} className="blog-btn-secondary inline-flex text-sm">
          Escolher contabilista
        </Link>
      </div>
    </aside>
  )
}

export function audienceLabel(audience: BlogAudience): string {
  switch (audience) {
    case 'escritorio':
      return 'Escritórios'
    case 'estudante':
      return 'Estudantes'
    case 'pme':
      return 'PME / Lda'
    default:
      return 'Independentes'
  }
}
