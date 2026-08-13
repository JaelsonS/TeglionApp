/**
 * Progressão do escritório — fonte única para onboarding + «próximo passo» do Dashboard.
 * Sem arquitetura exagerada: só regras de produto claras e testáveis.
 */

export type FirmProgressStepId =
  | 'profile'
  | 'publicPage'
  | 'service'
  | 'booking'
  | 'client'
  | 'invite'

export type FirmProgressStep = {
  id: FirmProgressStepId
  label: string
  hint: string
  to: string
  done: boolean
  /** Passos opcionais não bloqueiam «já pode começar» */
  optional?: boolean
}

export type FirmNextAction = {
  id: string
  title: string
  description: string
  ctaLabel: string
  to: string
  mayaIntentId?: string
}

export type FirmProgressInput = {
  hasLogo: boolean
  firmSlug: string | null
  publicSitePublished: boolean
  serviceCount: number
  publicServiceCount: number
  hasBookingSchedule: boolean
  clientCount: number
  hasPortalInvite: boolean
  overdueCount?: number
  pendingInquiriesHint?: boolean
}

export type FirmProgressResult = {
  steps: FirmProgressStep[]
  doneRequired: number
  totalRequired: number
  progressPct: number
  canStartOperating: boolean
  nextAction: FirmNextAction | null
  publicUrl: string | null
}

function buildPublicUrl(firmSlug: string | null): string | null {
  if (!firmSlug) return null
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/${encodeURIComponent(firmSlug)}`
  }
  return `https://teglion.com/${encodeURIComponent(firmSlug)}`
}

export function computeFirmProgress(input: FirmProgressInput): FirmProgressResult {
  const hasSlug = Boolean(input.firmSlug && input.firmSlug !== 'escritorio')
  const hasService = input.serviceCount > 0
  const hasPublicService = input.publicServiceCount > 0
  const hasClient = input.clientCount > 0

  const steps: FirmProgressStep[] = [
    {
      id: 'profile',
      label: 'Configure o perfil do escritório',
      hint: 'Nome, logo e dados de contacto',
      to: '/app/firm/settings',
      done: input.hasLogo,
    },
    {
      id: 'publicPage',
      label: 'Configure e publique a página pública',
      hint: 'O link onde potenciais clientes o encontram',
      to: '/app/firm/settings?tab=pagina-publica',
      done: hasSlug && input.publicSitePublished,
    },
    {
      id: 'service',
      label: 'Publique o primeiro serviço',
      hint: 'Aparece na página pública e permite receber pedidos',
      to: '/app/firm/services',
      done: hasPublicService,
    },
    {
      id: 'booking',
      label: 'Configure a agenda e o booking',
      hint: 'Opcional — horários para marcações na página pública',
      to: '/app/firm/agenda?panel=settings',
      done: input.hasBookingSchedule,
      optional: true,
    },
    {
      id: 'client',
      label: 'Adicione a primeira empresa',
      hint: 'Carteira de clientes do escritório',
      to: '/app/firm/clients',
      done: hasClient,
    },
    {
      id: 'invite',
      label: 'Convide um cliente ao portal',
      hint: 'Opcional — partilhe o acesso ao portal Teglion',
      to: '/app/firm/clients',
      done: input.hasPortalInvite,
      optional: true,
    },
  ]

  const required = steps.filter((s) => !s.optional)
  const doneRequired = required.filter((s) => s.done).length
  const totalRequired = required.length
  const progressPct = Math.round((doneRequired / Math.max(totalRequired, 1)) * 100)
  const canStartOperating = input.hasLogo && hasPublicService

  const nextAction = resolveNextAction(input, {
    hasSlug,
    hasService,
    hasPublicService,
    hasClient,
  })

  return {
    steps,
    doneRequired,
    totalRequired,
    progressPct,
    canStartOperating,
    nextAction,
    publicUrl: buildPublicUrl(input.firmSlug),
  }
}

function resolveNextAction(
  input: FirmProgressInput,
  flags: { hasSlug: boolean; hasService: boolean; hasPublicService: boolean; hasClient: boolean },
): FirmNextAction | null {
  if (!input.hasLogo) {
    return {
      id: 'profile',
      title: 'Configure o perfil do escritório',
      description: 'Adicione o logo e os dados de contacto para o escritório ficar identificável na plataforma e na página pública.',
      ctaLabel: 'Abrir definições',
      to: '/app/firm/settings',
      mayaIntentId: 'tour',
    }
  }

  if (!flags.hasSlug || !input.publicSitePublished) {
    return {
      id: 'public-page',
      title: 'Publique a página do escritório',
      description:
        'É aqui que potenciais clientes conhecem os seus serviços e entram em contacto. Configure o conteúdo e publique o link.',
      ctaLabel: 'Configurar página',
      to: '/app/firm/settings?tab=pagina-publica',
      mayaIntentId: 'public-page',
    }
  }

  if (!flags.hasPublicService) {
    return {
      id: 'service',
      title: 'Publique o seu primeiro serviço',
      description:
        'Crie ou active um serviço que o escritório presta e marque-o como visível na página pública para começar a receber pedidos.',
      ctaLabel: 'Adicionar serviço',
      to: '/app/firm/services',
      mayaIntentId: 'service',
    }
  }

  if ((input.overdueCount ?? 0) > 0) {
    return {
      id: 'overdue',
      title: 'Há obrigações em atraso',
      description: 'Reveja os prazos em atraso para manter a carteira sob controlo.',
      ctaLabel: 'Ver obrigações',
      to: '/app/firm/tasks/obligations',
    }
  }

  if (input.pendingInquiriesHint) {
    return {
      id: 'inquiries',
      title: 'Há pedidos da página pública por tratar',
      description: 'Novos contactos chegaram pelas solicitações. Contacte-os e avance o estado do pedido.',
      ctaLabel: 'Ver solicitações',
      to: '/app/firm/services?tab=inquiries',
      mayaIntentId: 'requests',
    }
  }

  if (!flags.hasClient) {
    return {
      id: 'client',
      title: 'Adicione a primeira empresa à carteira',
      description: 'Registe um cliente para organizar documentos, prazos e o portal.',
      ctaLabel: 'Novo cliente',
      to: '/app/firm/clients',
    }
  }

  if (!input.hasBookingSchedule) {
    return {
      id: 'booking',
      title: 'Configure horários de marcação',
      description:
        'Opcional: defina disponibilidade na agenda para os clientes marcarem na página pública.',
      ctaLabel: 'Abrir agenda',
      to: '/app/firm/agenda?panel=settings',
      mayaIntentId: 'booking',
    }
  }

  return {
    id: 'ready',
    title: 'O escritório está pronto a operar',
    description: 'Acompanhe a carteira, os pedidos e a agenda. Se precisar de orientação, abra a Maya.',
    ctaLabel: 'Ver serviços',
    to: '/app/firm/services',
    mayaIntentId: 'tour',
  }
}
