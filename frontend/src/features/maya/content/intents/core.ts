import { defineIntent } from '@/features/maya/content/types'

export const CORE_INTENTS = [
  defineIntent({
    id: 'tour',
    title: 'O que é o Teglion?',
    shortDescription: 'visão geral do escritório',
    answer:
      'O Teglion é o sistema do seu escritório de contabilidade: carteira de clientes, documentos, prazos, agenda, página pública, serviços e pedidos. Não substitui o software de contabilidade clássico — organiza a relação com o cliente e a captação de trabalho. Eu sou a Maya: explico cada ecrã com base no que realmente existe nesta página.',
    steps: [
      'Abra o Painel — o cartão «Próximo passo» diz por onde começar',
      'Em Definições, coloque o logótipo e publique a página pública',
      'Em Serviços ou IRS, publique pelo menos um serviço',
      'Quando chegar um pedido, trate-o em Solicitações',
      'Depois adicione clientes à carteira e convide-os ao portal',
    ],
    deepLink: '/app/firm/dashboard',
    relatedIntents: ['public-page', 'service', 'clients', 'human-support'],
    followUpPrompt: 'Quer que eu explique o primeiro passo com mais detalhe?',
    nextSteps: [
      { label: 'Configurar página pública', intentId: 'public-page' },
      { label: 'Criar um serviço', intentId: 'service' },
      { label: 'Adicionar um cliente', intentId: 'clients-create' },
    ],
  }),
  defineIntent({
    id: 'dashboard-kpis',
    title: 'O que significam os números do Painel?',
    shortDescription: 'indicadores do painel',
    answer:
      'O Painel resume a carteira: quantas empresas tem, o que está em atraso, documentos por tratar e mensagens por ler. Os filtros «Tudo / Hoje / Esta semana» mudam o período desses números — não apagam dados. «Nova tarefa» leva-o às Tarefas internas, não às obrigações fiscais dos clientes.',
    steps: [
      'Escolha o período no topo se quiser focar o dia ou a semana',
      'Use os atalhos (Serviços, Clientes, Pedir documentos, Obrigações) para saltar para a área certa',
      'Se houver obrigações em atraso, abra Obrigações dos Clientes',
    ],
    deepLink: '/app/firm/dashboard',
    relatedIntents: ['tour', 'obligations', 'documents', 'tasks-manual'],
    ctaLabel: 'Ficar no Painel',
  }),
  defineIntent({
    id: 'human-support',
    title: 'Falar com uma pessoa',
    shortDescription: 'suporte humano Teglion',
    answer:
      'Se preferir falar com uma pessoa da AfDigital — Soluções Tecnológicas (quem desenvolve e opera o Teglion), use WhatsApp, e-mail ou telefone nos canais oficiais em Ajuda e suporte. Eu ajudo a navegar no produto; não vejo os seus documentos, NIFs nem mensagens privadas, e não substituo o suporte humano.',
    steps: [
      'Abra Ajuda e suporte',
      'Escolha WhatsApp, e-mail ou telefone',
      'Se for só uma dúvida de ecrã, volte à Maya na página em que está',
    ],
    deepLink: '/app/firm/ajuda',
    relatedIntents: ['tour', 'settings'],
    ctaLabel: 'Abrir Ajuda e suporte',
  }),
]
