/** Intents Maya por zona da pré-visualização — fonte única para o editor da página pública. */

export type PublicSiteEditorGuideEntry = {
  /** Texto curto na pergunta «Quer ajuda com …?» */
  topicLabel: string
  intentId: string
}

const BY_ZONE: Record<string, PublicSiteEditorGuideEntry> = {
  header: { topicLabel: 'a barra do topo e logótipos', intentId: 'public-page-logos' },
  hero: { topicLabel: 'o destaque principal e imagens', intentId: 'public-page-media' },
  about: { topicLabel: 'a secção Sobre o escritório', intentId: 'public-page-media' },
  services: { topicLabel: 'serviços com marcação online', intentId: 'public-page-featured' },
  bookingServices: { topicLabel: 'serviços por formulário', intentId: 'public-page-featured' },
  features: { topicLabel: 'diferenciais', intentId: 'public-page-sections' },
  process: { topicLabel: 'como funciona', intentId: 'public-page-sections' },
  faq: { topicLabel: 'perguntas frequentes', intentId: 'public-page-sections' },
  contact: { topicLabel: 'contactos e redes', intentId: 'public-page-sections' },
  footer: { topicLabel: 'o rodapé legal', intentId: 'public-page-sections' },
}

export function resolvePublicSiteEditorGuide(zone: string | null | undefined): PublicSiteEditorGuideEntry {
  const key = String(zone || '').trim()
  return BY_ZONE[key] ?? { topicLabel: 'a página pública', intentId: 'public-page' }
}
