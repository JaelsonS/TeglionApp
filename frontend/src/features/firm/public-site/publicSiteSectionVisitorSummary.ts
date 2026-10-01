import type { PublicFirmServiceSummary } from '@/infrastructure/api/contabil/public'
import type { PublicSiteSection } from '@/shared/types/firmPublicSite'

export function resolvePublicSiteSectionVisitorSummary(
  section: PublicSiteSection,
  services: PublicFirmServiceSummary[],
): string | null {
  if (!section.enabled) {
    return 'O visitante não vê esta secção (desactivada).'
  }

  switch (section.type) {
    case 'header':
      return 'O visitante vê: barra do topo com nome, menu e links.'
    case 'hero': {
      const c = section.content
      const hasPhoto = (c.imageIds?.length ?? 0) > 0
      const hasText = [c.title, c.tagline, c.bio].some((v) => String(v || '').trim())
      if (!hasText && !hasPhoto) return 'O visitante vê: destaque vazio até preencher texto ou imagem.'
      return 'O visitante vê: destaque principal com texto e/ou imagem de fundo.'
    }
    case 'about':
      return 'O visitante vê: texto sobre o escritório (e foto, se carregar).'
    case 'services':
    case 'bookingServices': {
      const booking = section.type === 'services'
      const pool = services.filter((s) => Boolean(s.requiresBooking) === booking)
      const featured = section.content.featuredServiceSlugs?.length ?? 0
      const heading = String(section.content.heading || '').trim()
      const parts: string[] = []
      if (heading) parts.push(`título «${heading}»`)
      if (featured > 0) parts.push(`${featured} cartão(ões) em destaque`)
      parts.push(`${pool.length} serviço(s) na grelha`)
      const kind = booking ? 'com marcação online' : 'por formulário (sem horário)'
      return `O visitante vê: lista ${kind}${parts.length ? ` — ${parts.join(' · ')}` : ''}.`
    }
    case 'features':
      return 'O visitante vê: pontos fortes (se adicionar itens).'
    case 'process':
      return 'O visitante vê: passos «Como funciona» (se preencher).'
    case 'faq':
      return 'O visitante vê: perguntas frequentes (se adicionar).'
    case 'contact':
      return 'O visitante vê: email, telefone e morada (conforme opções activas).'
    case 'footer':
      return 'O visitante vê: rodapé com redes, contactos (se Contactos off) e links legais.'
    default:
      return null
  }
}
