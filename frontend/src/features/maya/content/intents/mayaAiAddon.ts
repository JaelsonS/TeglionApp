import { defineIntent } from '@/features/maya/content/types'

export const MAYA_AI_ADDON_INTENTS = [
  defineIntent({
    id: 'maya-ai-addon',
    title: 'Maya com IA (custo adicional)',
    shortDescription: 'Guia grátis vs configuração com IA',
    answer:
      'A Maya guia (menus, ecrãs, passos no Painel) está incluída — não consome OpenAI. A «Configuração rápida» e futuras funcionalidades generativas usam IA na nuvem (subcontratante) e dependem do add-on ou plano com feature «ai». O escritório revê sempre antes de publicar; nenhum dado de clientes vai para a IA no Setup.',
    steps: [
      'Use a Maya flutuante para orientação sem custo de IA',
      'Configuração rápida: consentimento + questionário (add-on «ai» ou piloto)',
      'Assistente de activação: passos validados no produto, sem LLM',
    ],
    relatedIntents: ['maya-setup', 'activation-assistant', 'billing'],
    ctaLabel: 'Ver plano e subscrição',
    deepLink: '/app/firm/settings?tab=plano',
  }),
]
