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
    shortDescription: 'visão geral do escritório',
    answer:
      'O Teglion é o sistema do seu escritório: carteira de clientes, documentos, prazos, agenda, página pública, serviços e pedidos. Comece pelo painel e pelas Definições — e use «? Maya» em qualquer módulo quando precisar.',
    steps: [
      'Abra o Painel para ver o estado da carteira',
      'Configure o perfil e a página pública em Definições',
      'Publique um serviço e receba o primeiro pedido',
    ],
    deepLink: '/app/firm/dashboard',
    relatedIntents: ['public-page', 'service', 'settings', 'human-support'],
  },
  {
    id: 'settings',
    title: 'O que configuro em Definições?',
    shortDescription: 'hub de Definições',
    answer:
      'Em Definições gere a identidade do escritório, a página pública, dados do escritório, pagamentos dos clientes (Stripe), o seu perfil, a equipa e as notificações. A secção mais importante para captação é Página pública.',
    steps: [
      'Identidade — logótipo e aspeto no menu e no portal',
      'Página pública — o que os clientes vêem na internet',
      'Escritório — nome, contactos e dados fiscais',
      'Pagamentos — receber online dos clientes (opcional)',
      'Equipa e perfil — acessos e a sua conta',
    ],
    deepLink: '/app/firm/settings',
    relatedIntents: ['public-page', 'payments', 'tour'],
  },
  {
    id: 'public-page',
    title: 'Como configurar a página pública?',
    shortDescription: 'página pública do escritório',
    answer:
      'A página pública é a porta de entrada dos potenciais clientes. Em Definições → Página pública edita pela ordem do visitante: link e nome na barra → destaque (imagem e textos) → secções → rodapé → temas/legais → guardar rascunho → pré-visualizar → publicar. O link fica teglion.com/o-seu-slug. Sem publicar, o site não fica visível ao público.',
    steps: [
      'Abrir Definições → Página pública',
      'Definir link público (slug) e nome na barra do topo',
      '1. Barra do topo — só cores (o texto vem do nome acima)',
      '2. Destaque — foto de capa, depois título, frase de destaque, parágrafo e botões',
      'Seguir as secções na ordem da lista (Sobre, Serviços, FAQ, Contactos, Rodapé…)',
      'Ajustar tema, preços e textos legais se precisar',
      'Guardar rascunho → Pré-visualizar → Publicar e partilhar o link',
    ],
    deepLink: '/app/firm/settings?tab=pagina-publica',
    relatedIntents: ['service', 'booking', 'irs-campaign', 'settings'],
  },
  {
    id: 'service',
    title: 'Como criar um serviço?',
    shortDescription: 'catálogo de serviços',
    answer:
      'Em Serviços → Catálogo active um modelo ou adicione um serviço. Configure oferta e formulário, depois publique (slug + página pública). Os pedidos do site chegam a Solicitações — a Central é só para clientes já na app.',
    steps: [
      'Abrir Serviços → Catálogo',
      'Adicionar ou activar um serviço',
      'Configurar preço e formulário',
      'Publicar no site e partilhar o link',
    ],
    deepLink: '/app/firm/services',
    relatedIntents: ['requests', 'public-page', 'irs-campaign'],
  },
  {
    id: 'irs',
    title: 'O que é o IRS no Teglion?',
    shortDescription: 'hub IRS',
    answer:
      'No Teglion, IRS é uma campanha de captação: publique serviços de apoio ao IRS na página pública e receba pedidos em Solicitações. Não calcula o imposto.',
    steps: [
      'Abrir Campanha IRS',
      'Activar um modelo (ex.: Modelo 3) ou criar serviço',
      'Publicar no site (editor → Publicação)',
      'Gerir pedidos em Serviços → Solicitações',
    ],
    deepLink: '/app/firm/irs',
    relatedIntents: ['irs-campaign', 'service', 'requests'],
  },
  {
    id: 'irs-campaign',
    title: 'Como funciona a campanha IRS?',
    shortDescription: 'campanha IRS',
    answer:
      'A campanha IRS liga um serviço publicado à página pública. Configure o serviço (Modelo 3 ou outro), publique com slug, partilhe a página e trate os pedidos em Solicitações — não na Central.',
    steps: [
      'Configurar ou activar o serviço IRS',
      'Publicar (slug + «na página pública»)',
      'Abrir a página pública e confirmar que o serviço aparece',
      'Acompanhar Solicitações quando chegarem pedidos',
    ],
    deepLink: '/app/firm/irs',
    relatedIntents: ['irs', 'public-page', 'requests'],
  },
  {
    id: 'agenda',
    title: 'Como usar a agenda?',
    shortDescription: 'agenda e reuniões',
    answer:
      'Na Agenda marca eventos, define disponibilidade de agendamento e pode ligar o Google Calendar. O agendamento na página pública usa os horários que configurar nas Definições da agenda.',
    steps: [
      'Abrir Agenda',
      'Criar um evento ou abrir Definições',
      'Definir disponibilidade e serviços de marcação',
      'Opcional: ligar Google Calendar',
    ],
    deepLink: '/app/firm/agenda',
    relatedIntents: ['booking', 'service'],
  },
  {
    id: 'booking',
    title: 'Como configurar o agendamento?',
    shortDescription: 'marcação na página pública',
    answer:
      'O agendamento na página pública combina um serviço publicável com horários da Agenda. Em Agenda → Definições configure disponibilidade; no serviço active a marcação e publique.',
    steps: [
      'Configurar disponibilidade na Agenda',
      'Associar serviço de marcação',
      'Publicar o serviço na página pública',
      'Receber e confirmar pedidos',
    ],
    deepLink: '/app/firm/agenda?panel=settings',
    relatedIntents: ['agenda', 'service', 'public-page'],
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
    relatedIntents: ['service', 'public-page', 'clients'],
  },
  {
    id: 'clients',
    title: 'Como gerir clientes?',
    shortDescription: 'carteira de clientes',
    answer:
      'Em Clientes gere a carteira: cadastro, hub de cada empresa e acesso ao portal Teglion. Pode convidar por email, copiar o link de convite e revogar ou reemitir acesso sem perder dados.',
    steps: [
      'Criar um cliente ou abrir o hub existente',
      'Convidar ao portal (um ou vários)',
      'Acompanhar documentos, tarefas e estado no hub',
      'Gerir acesso (revogar / reenviar) quando necessário',
    ],
    deepLink: '/app/firm/clients',
    relatedIntents: ['documents', 'messages', 'obligations'],
  },
  {
    id: 'documents',
    title: 'Como funcionam os documentos?',
    shortDescription: 'hub de documentos',
    answer:
      'Em Documentos centraliza ficheiros dos clientes: pedidos formais, ficheiros por período e histórico. Peça documentos em falta — o cliente recebe no portal — e acompanhe o estado sem sair desta área.',
    steps: [
      'Escolha o cliente em Pedidos ou Ficheiros',
      'Envie um ficheiro ou peça um documento específico',
      'Acompanhe pendentes e concluídos',
      'Consulte o Histórico por cliente e período',
    ],
    deepLink: '/app/firm/documents/requests',
    relatedIntents: ['clients', 'messages', 'obligations'],
  },
  {
    id: 'messages',
    title: 'Como usar as mensagens?',
    shortDescription: 'chat com clientes',
    answer:
      'Em Mensagens conversa directamente com a carteira: texto, anexos e histórico num só sítio. O cliente recebe no portal. Pode fixar conversas importantes no topo da lista.',
    steps: [
      'Seleccione um cliente na lista',
      'Escreva e anexe ficheiros se precisar',
      'Use o menu ⋯ para fixar conversas importantes',
      'Combine com Documentos para pedidos formais',
    ],
    deepLink: '/app/firm/messages',
    relatedIntents: ['documents', 'clients'],
  },
  {
    id: 'obligations',
    title: 'Obrigações vs tarefas — qual a diferença?',
    shortDescription: 'tarefas e obrigações',
    answer:
      'Obrigações são prazos e entregas dos clientes (IVA, IRS, Segurança Social…), muitas vezes geradas pelo calendário fiscal. Tarefas são o trabalho interno da equipa — o que o escritório precisa de fazer, ligado ou não a uma obrigação.',
    steps: [
      'Use Obrigações para prazos dos clientes',
      'Use Tarefas para trabalho interno da equipa',
      'Alterne vistas (por cliente, calendário, separadores)',
      'Abra o Calendário Fiscal para alimentar prazos nacionais',
    ],
    deepLink: '/app/firm/tasks/overview',
    relatedIntents: ['fiscal-calendar', 'clients', 'documents'],
  },
  {
    id: 'fiscal-calendar',
    title: 'Como usar o calendário fiscal?',
    shortDescription: 'calendário fiscal',
    answer:
      'O Calendário Fiscal organiza prazos do escritório: importe o modelo Portugal, crie eventos e categorias, e defina recorrências (mensal, trimestral, anual). Pode editar só uma ocorrência quando precisar.',
    steps: [
      'Importar o modelo Portugal ou criar eventos',
      'Configurar categorias e cores',
      'Definir recorrência quando fizer sentido',
      'Acompanhar próximos prazos no resumo',
    ],
    deepLink: '/app/firm/fiscal-calendar',
    relatedIntents: ['obligations', 'tour'],
  },
  {
    id: 'payments',
    title: 'Como receber pagamentos dos clientes?',
    shortDescription: 'Stripe Connect',
    answer:
      'Em Definições → Pagamentos liga a conta Stripe do escritório para os clientes pagarem no Checkout. O dinheiro vai para a conta do escritório — a Teglion só faz a ponte técnica. A mensalidade Teglion é outro fluxo (Plano e subscrição).',
    steps: [
      'Abrir Definições → Pagamentos (só o responsável)',
      'Ler e aceitar a política registada',
      'Concluir o onboarding Stripe do escritório',
      'Publicar serviços com pagamento quando estiver pronto',
    ],
    deepLink: '/app/firm/settings?tab=pagamentos',
    relatedIntents: ['billing', 'service', 'settings'],
  },
  {
    id: 'billing',
    title: 'Como funciona o plano Teglion?',
    shortDescription: 'plano e subscrição',
    answer:
      'Em Plano e subscrição gere o plano Teglion do escritório (teste, mensal ou anual). Isto é a faturação da plataforma — não a facturação aos seus clientes finais.',
    steps: [
      'Abrir Plano e subscrição',
      'Ver estado do teste ou plano activo',
      'Escolher mensal ou anual se necessário',
      'Gerir pagamento no portal Stripe quando disponível',
    ],
    deepLink: '/app/firm/billing',
    relatedIntents: ['payments', 'tour'],
  },
  {
    id: 'alerts',
    title: 'Para que serve a Central de Alertas?',
    shortDescription: 'comunicados a clientes',
    answer:
      'Use a Central de Alertas para avisar clientes sobre informações importantes — prazos, novidades fiscais ou avisos operacionais — de forma profissional e rastreável (quem leu / confirmou).',
    steps: [
      'Escreva o comunicado (título e mensagem)',
      'Escolha toda a carteira ou clientes específicos',
      'Publique e acompanhe o envolvimento',
      'Para conteúdo longo, use Notícias no portal',
    ],
    deepLink: '/app/firm/alerts',
    relatedIntents: ['news', 'clients'],
  },
  {
    id: 'news',
    title: 'Como publicar notícias?',
    shortDescription: 'notícias do portal',
    answer:
      'Em Notícias publique artigos para os clientes lerem no portal. Diferente da Central de Alertas (avisos pontuais), aqui é conteúdo mais completo e informativo.',
    steps: [
      'Escreva o artigo e adicione capa se quiser',
      'Marque como destaque se for a notícia principal',
      'Publique para ficar visível no portal',
      'Use Alertas para avisos operacionais curtos',
    ],
    deepLink: '/app/firm/news',
    relatedIntents: ['alerts', 'clients'],
  },
  {
    id: 'human-support',
    title: 'Falar com uma pessoa',
    shortDescription: 'suporte humano Teglion',
    answer:
      'Se preferir falar directamente com uma pessoa da nossa equipa, use WhatsApp, email ou telefone — canais oficiais do Teglion / AfDigital. Eu sou a Maya, a assistente guiada: ajudo a navegar no produto, mas não substituo o suporte humano.',
    steps: [
      'Abrir Ajuda e suporte no escritório',
      'Escolher WhatsApp, email ou telefone',
      'Ou pedir «? Maya» noutro módulo se for só orientação no produto',
    ],
    deepLink: '/app/firm/ajuda',
    relatedIntents: ['tour', 'settings'],
  },
]

/** Intent sugerido por módulo / ecrã. */
export const MAYA_MODULE_INTENT: Record<string, string> = {
  dashboard: 'tour',
  settings: 'settings',
  'public-page': 'public-page',
  services: 'service',
  irs: 'irs-campaign',
  agenda: 'agenda',
  clients: 'clients',
  documents: 'documents',
  messages: 'messages',
  obligations: 'obligations',
  tasks: 'obligations',
  'fiscal-calendar': 'fiscal-calendar',
  payments: 'payments',
  billing: 'billing',
  alerts: 'alerts',
  news: 'news',
  help: 'human-support',
  support: 'human-support',
}

export function getMayaIntent(id: string): MayaIntent | undefined {
  return MAYA_INTENTS.find((i) => i.id === id)
}
