import { defineIntent } from '@/features/maya/content/types'

export const MAYA_SETUP_INTENTS = [
  defineIntent({
    id: 'maya-setup',
    title: 'Configuração rápida',
    shortDescription: 'Maya Setup — rascunho com IA',
    answer:
      'Se é o responsável do escritório, posso ajudá-lo a preparar um rascunho da página pública, serviços do catálogo e horários de agenda a partir de um questionário curto. A proposta é gerada com apoio de IA (OpenAI); revê tudo antes de aplicar. Nada é publicado automaticamente — e isto não substitui aconselhamento fiscal.',
    steps: [
      'Abra «Configuração rápida» e aceite o consentimento',
      'Responda ao questionário (país, serviços, tom, região)',
      'Revise o preview (página, serviços, IRS, horários)',
      'Aplique o rascunho e publique manualmente quando estiver satisfeito',
    ],
    relatedIntents: ['public-page', 'service', 'irs-campaign', 'tour'],
    ctaLabel: 'Abrir configuração rápida',
    ownerOnly: true,
    deepLink: '/app/firm/dashboard',
  }),
]
