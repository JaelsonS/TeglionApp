import type { FirmProgressInput, FirmProgressResult, FirmProgressStepId } from '@/features/firm/onboarding/firmProgress'

export type ActivationPhaseId =
  | 'profile'
  | 'mayaSetup'
  | 'publishPage'
  | 'publishServices'
  | 'firstClient'
  | 'complete'

export type ActivationPhase = {
  id: ActivationPhaseId
  title: string
  description: string
  /** Validação automática — o que o sistema verifica neste passo */
  validationHint: string
  ctaLabel: string
  to: string
  /** Checklist manual (ex.: legal) — não bloqueia auto-avanço */
  manualChecklist?: string[]
  mayaIntentId?: string
  opensMayaSetup?: boolean
  opensClientsCsv?: boolean
}

export const ACTIVATION_PHASE_ORDER: ActivationPhaseId[] = [
  'profile',
  'mayaSetup',
  'publishPage',
  'publishServices',
  'firstClient',
  'complete',
]

const PHASE_COPY: Record<Exclude<ActivationPhaseId, 'complete'>, Omit<ActivationPhase, 'id'>> = {
  profile: {
    title: 'Perfil do escritório',
    description:
      'Carregue o logótipo e confirme nome e contactos. Sem isto a página pública não fica credível para quem chega pelo link.',
    validationHint: 'Logótipo carregado nas Definições → Identidade.',
    ctaLabel: 'Abrir identidade',
    to: '/app/firm/settings',
    mayaIntentId: 'tour',
  },
  mayaSetup: {
    title: 'Configuração rápida (Maya + IA)',
    description:
      'Opcional mas recomendado: a Maya gera rascunho da página, serviços do catálogo, horários e campanha IRS (PT). Nada é publicado automaticamente.',
    validationHint: 'Aplicou o rascunho no wizard ou escolheu «Continuar sem IA».',
    ctaLabel: 'Abrir configuração rápida',
    to: '/app/firm/dashboard',
    opensMayaSetup: true,
    mayaIntentId: 'maya-setup',
  },
  publishPage: {
    title: 'Publicar a página pública',
    description:
      'Revise o rascunho (ou o conteúdo que escreveu), confirme o slug e publique. Só então o link fica visível para potenciais clientes.',
    validationHint: 'Página com estado «publicada» em Definições → Página pública.',
    ctaLabel: 'Rever e publicar',
    to: '/app/firm/settings?tab=pagina-publica',
    mayaIntentId: 'public-page',
    manualChecklist: [
      'Revise textos e contactos — a IA pode errar detalhes.',
      'Confirme avisos legais / cookies se o produto os solicitar antes de publicar.',
      'Publique manualmente — o Teglion não publica por si.',
    ],
  },
  publishServices: {
    title: 'Tornar serviços visíveis',
    description:
      'Active ou crie serviços e marque pelo menos um como «visível na página pública», com slug e formulário prontos para receber pedidos.',
    validationHint: 'Pelo menos um serviço activo e público na lista de Serviços.',
    ctaLabel: 'Gerir serviços',
    to: '/app/firm/services',
    mayaIntentId: 'service',
    manualChecklist: [
      'Serviços criados pela Maya ficam activos mas não públicos — publique os que quiser oferecer online.',
    ],
  },
  firstClient: {
    title: 'Primeira empresa na carteira',
    description:
      'Registe um cliente para usar documentos, prazos e portal. A captacao online já pode funcionar antes disto; a carteira completa o arranque.',
    validationHint: 'Pelo menos uma empresa em Clientes.',
    ctaLabel: 'Adicionar cliente',
    to: '/app/firm/clients',
    mayaIntentId: 'clients-csv',
    opensClientsCsv: true,
    manualChecklist: [
      'Pode importar CSV (modelo no Teglion) ou criar manualmente — nunca envie senhas reais por e-mail.',
      'A Maya explica o formato CSV sem usar IA generativa.',
    ],
  },
}

export type ResolveActivationPhaseInput = FirmProgressInput & {
  isOwner: boolean
  mayaSetupSkipped: boolean
  mayaSetupApplied: boolean
}

export function resolveActivationPhase(input: ResolveActivationPhaseInput): ActivationPhase {
  const hasSlug = Boolean(input.firmSlug && input.firmSlug !== 'escritorio')
  const hasPublicService = input.publicServiceCount > 0
  const hasClient = input.clientCount > 0

  if (!input.hasLogo) {
    return { id: 'profile', ...PHASE_COPY.profile }
  }

  const mayaSetupDone =
    !input.isOwner || input.mayaSetupSkipped || input.mayaSetupApplied

  if (!mayaSetupDone) {
    return { id: 'mayaSetup', ...PHASE_COPY.mayaSetup }
  }

  if (!hasSlug || !input.publicSitePublished) {
    return { id: 'publishPage', ...PHASE_COPY.publishPage }
  }

  if (!hasPublicService) {
    return { id: 'publishServices', ...PHASE_COPY.publishServices }
  }

  if (!hasClient) {
    return { id: 'firstClient', ...PHASE_COPY.firstClient }
  }

  return {
    id: 'complete',
    title: 'Escritório pronto no Teglion',
    description:
      'Perfil, página, serviço público e primeira empresa — pode focar-se na carteira, pedidos e agenda. A Maya continua disponível para dúvidas.',
    validationHint: 'Todos os passos essenciais concluídos.',
    ctaLabel: 'Ir ao painel',
    to: '/app/firm/dashboard',
    mayaIntentId: 'tour',
  }
}

export function activationPhaseIndex(id: ActivationPhaseId): number {
  return ACTIVATION_PHASE_ORDER.indexOf(id)
}

export function isActivationGuideIncomplete(input: ResolveActivationPhaseInput): boolean {
  return resolveActivationPhase(input).id !== 'complete'
}

export function phaseIsDone(id: ActivationPhaseId, input: ResolveActivationPhaseInput): boolean {
  const current = resolveActivationPhase(input).id
  if (id === 'complete') return current === 'complete'
  return activationPhaseIndex(id) < activationPhaseIndex(current)
}

export type ActivationProgressSignals = {
  firmSlug: string | null
  isOwner: boolean
  mayaSetupSkipped: boolean
  mayaSetupApplied: boolean
  hasAnyService: boolean
  serviceCount: number
  publicServiceCount: number
}

function stepDone(progress: FirmProgressResult, id: FirmProgressStepId): boolean {
  return progress.steps.find((s) => s.id === id)?.done ?? false
}

export function buildActivationPhaseInput(
  progress: FirmProgressResult,
  signals: ActivationProgressSignals,
): ResolveActivationPhaseInput {
  return {
    hasLogo: stepDone(progress, 'profile'),
    firmSlug: signals.firmSlug,
    publicSitePublished: stepDone(progress, 'publicPage'),
    serviceCount: signals.serviceCount,
    publicServiceCount: signals.publicServiceCount,
    hasBookingSchedule: stepDone(progress, 'booking'),
    clientCount: stepDone(progress, 'client') ? 1 : 0,
    hasPortalInvite: stepDone(progress, 'invite'),
    isOwner: signals.isOwner,
    mayaSetupSkipped: signals.mayaSetupSkipped,
    mayaSetupApplied: signals.mayaSetupApplied,
  }
}

export function resolveActivationPhaseFromProgress(
  progress: FirmProgressResult,
  signals: ActivationProgressSignals,
): ActivationPhase {
  return resolveActivationPhase(buildActivationPhaseInput(progress, signals))
}

export function phaseIsDoneFromProgress(
  id: ActivationPhaseId,
  progress: FirmProgressResult,
  signals: ActivationProgressSignals,
): boolean {
  return phaseIsDone(id, buildActivationPhaseInput(progress, signals))
}
