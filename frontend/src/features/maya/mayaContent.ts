/**
 * Maya v1 — conteúdo estático (sem LLM, sem dados de negócio).
 * Cada intent: id, title, answer, steps, deepLink, relatedIntents.
 */

export type MayaIntent = {
  id: string
  title: string
  shortDescription: string
  answer: string
  steps: string[]
  deepLink: string
  relatedIntents: string[]
}

export const MAYA_INTENTS: MayaIntent[] = [
  {
    id: 'tour',
    title: 'Quero conhecer o Teglion',
    shortDescription: 'Visão geral do escritório digital',
    answer:
      'O Teglion é o sistema do seu escritório: carteira de clientes, documentos, prazos, agenda, página pública, serviços e pedidos. Comece pelo painel e pelas Definições.',
    steps: [
      'Abra o Painel para ver o estado da carteira',
      'Configure o perfil e a página pública em Definições',
      'Publique um serviço e receba o primeiro pedido',
    ],
    deepLink: '/app/firm/dashboard',
    relatedIntents: ['public-page', 'service'],
  },
  {
    id: 'public-page',
    title: 'Como configurar a minha página?',
    shortDescription: 'Link público do escritório',
    answer:
      'A página pública é a porta de entrada dos clientes. Em Definições → Página pública pode editar conteúdos, pré-visualizar e publicar. O link fica no formato teglion.com/o-seu-slug.',
    steps: [
      'Abrir Definições',
      'Abrir Página pública',
      'Configurar informações e secções',
      'Publicar e partilhar o link',
    ],
    deepLink: '/app/firm/settings?tab=pagina-publica',
    relatedIntents: ['service', 'irs'],
  },
  {
    id: 'service',
    title: 'Como criar um serviço?',
    shortDescription: 'Catálogo e publicação',
    answer:
      'Em Serviços pode activar modelos do catálogo ou criar um serviço próprio. Configure informações, como o cliente solicita, e publique na página pública para começar a receber pedidos.',
    steps: [
      'Abrir Serviços',
      'Activar ou criar um serviço',
      'Configurar preço e formulário',
      'Publicar no site',
    ],
    deepLink: '/app/firm/services',
    relatedIntents: ['requests', 'irs'],
  },
  {
    id: 'irs',
    title: 'Como funciona o IRS?',
    shortDescription: 'Hub de captação — não calcula imposto',
    answer:
      'No Teglion, IRS é um hub de campanha e captação de serviços relacionados com IRS. Não calcula o imposto: ajuda a publicar serviços, receber pedidos e organizá-los.',
    steps: [
      'Abrir a área IRS',
      'Activar um modelo (ex.: Modelo 3) ou criar serviço',
      'Publicar no site',
      'Gerir pedidos em Solicitações',
    ],
    deepLink: '/app/firm/irs',
    relatedIntents: ['service', 'requests'],
  },
  {
    id: 'agenda',
    title: 'Como configurar a agenda?',
    shortDescription: 'Reuniões e disponibilidade',
    answer:
      'Na Agenda marca eventos, define disponibilidade de booking e pode ligar o Google Calendar. O booking público usa os horários que configurar nas Definições da agenda.',
    steps: [
      'Abrir Agenda',
      'Criar um evento ou abrir Definições',
      'Definir disponibilidade e serviços de marcação',
      'Opcional: ligar Google Calendar',
    ],
    deepLink: '/app/firm/agenda',
    relatedIntents: ['service', 'tour'],
  },
  {
    id: 'booking',
    title: 'Como configurar o booking?',
    shortDescription: 'Marcação na página pública',
    answer:
      'O booking combina um serviço publicável com horários da Agenda. Em Agenda → Definições configure disponibilidade; no serviço active a marcação e publique.',
    steps: [
      'Configurar disponibilidade na Agenda',
      'Associar serviço de marcação',
      'Publicar o serviço na página pública',
      'Receber e confirmar pedidos',
    ],
    deepLink: '/app/firm/agenda?panel=settings',
    relatedIntents: ['agenda', 'service'],
  },
  {
    id: 'requests',
    title: 'Como receber pedidos?',
    shortDescription: 'Solicitações e Central',
    answer:
      'Pedidos de novos contactos da página pública aparecem em Solicitações. Pedidos de clientes já activos ficam na Central de Serviços. Ambos começam com um serviço publicado.',
    steps: [
      'Publicar pelo menos um serviço',
      'Partilhar a página pública',
      'Acompanhar Solicitações e Central',
      'Responder e converter em cliente quando fizer sentido',
    ],
    deepLink: '/app/firm/services',
    relatedIntents: ['service', 'public-page'],
  },
  {
    id: 'billing',
    title: 'Como funciona a faturação?',
    shortDescription: 'Plano Teglion do escritório',
    answer:
      'Em Plano e subscrição gere o plano Teglion do escritório (teste, mensal ou anual). Isto é a faturação da plataforma — não a facturação aos seus clientes finais.',
    steps: [
      'Abrir Plano e subscrição',
      'Ver estado do teste ou plano activo',
      'Escolher mensal ou anual se necessário',
      'Gerir pagamento no portal Stripe quando disponível',
    ],
    deepLink: '/app/firm/billing',
    relatedIntents: ['tour'],
  },
]

export function getMayaIntent(id: string): MayaIntent | undefined {
  return MAYA_INTENTS.find((i) => i.id === id)
}
