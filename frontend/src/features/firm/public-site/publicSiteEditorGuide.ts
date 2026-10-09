/** Intents Maya por zona da pré-visualização — fonte única para o editor da página pública. */

export type PublicSiteEditorGuideEntry = {
  intentId: string
  /** Dica curta em voz da Maya (tooltip na pré-visualização). */
  mayaTip: string
}

const BY_ZONE: Record<string, PublicSiteEditorGuideEntry> = {
  'link-publish': {
    intentId: 'public-page',
    mayaTip: 'Defina o link teglion.com/…, guarde o rascunho e publique quando estiver pronto — o visitante só vê a versão publicada.',
  },
  header: {
    intentId: 'public-page-logos',
    mayaTip: 'Aqui define a barra do topo e os logótipos — é o que o visitante vê primeiro.',
  },
  hero: {
    intentId: 'public-page-media',
    mayaTip: 'Este bloco é o destaque principal: título, texto e imagem definem a primeira impressão.',
  },
  about: {
    intentId: 'public-page-media',
    mayaTip: 'Use «Sobre o escritório» para contar quem são e gerar confiança.',
  },
  services: {
    intentId: 'public-page-featured',
    mayaTip: 'Serviços com marcação online aparecem aqui — alinhe com o catálogo do escritório.',
  },
  bookingServices: {
    intentId: 'public-page-featured',
    mayaTip: 'Lista serviços pedidos por formulário — útil para ofertas sem agenda automática.',
  },
  features: {
    intentId: 'public-page-sections',
    mayaTip: 'Diferenciais em bullets: o que torna o escritório único para quem visita.',
  },
  process: {
    intentId: 'public-page-sections',
    mayaTip: '«Como funciona» explica passos simples — reduz dúvidas antes do contacto.',
  },
  faq: {
    intentId: 'public-page-sections',
    mayaTip: 'Perguntas frequentes respondem objecções comuns sem precisarem de telefonar.',
  },
  contact: {
    intentId: 'public-page-sections',
    mayaTip: 'Contactos e redes sociais ficam nesta zona — o visitante sabe como falar consigo.',
  },
  footer: {
    intentId: 'public-page-sections',
    mayaTip: 'O rodapé legal mostra termos, privacidade e links institucionais obrigatórios.',
  },
}

export function resolvePublicSiteEditorGuide(zone: string | null | undefined): PublicSiteEditorGuideEntry {
  const key = String(zone || '').trim()
  return (
    BY_ZONE[key] ?? {
      intentId: 'public-page',
      mayaTip: 'Cada zona da página pública pode ser editada ao lado — posso guiá-lo passo a passo.',
    }
  )
}
