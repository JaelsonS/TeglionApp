import { defineIntent } from '@/features/maya/content/types'

export const ACTIVATION_ASSISTANT_INTENTS = [
  defineIntent({
    id: 'activation-assistant',
    title: 'Assistente de activação',
    shortDescription: 'Guia até o escritório estar pronto',
    answer:
      'O Assistente de activação guia-o na ordem certa: perfil com logo, configuração rápida opcional com IA, publicar a página (com revisão legal), tornar serviços públicos e registar a primeira empresa. Cada passo abre o ecrã certo; o sistema valida quando conclui — nada é publicado automaticamente.',
    steps: [
      'Abra o Assistente de activação no Painel',
      'Siga o passo «Agora» — clique para ir ao ecrã indicado',
      'Use a Maya Setup no passo de IA ou «Continuar sem IA»',
      'Volte ao assistente até ver «Escritório pronto no Teglion»',
    ],
    relatedIntents: ['maya-setup', 'public-page', 'service', 'clients', 'tour'],
    ctaLabel: 'Abrir assistente de activação',
    ownerOnly: true,
    deepLink: '/app/firm/dashboard?activation=1',
  }),
]
