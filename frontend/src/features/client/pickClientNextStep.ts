export type ClientNextStepTone = 'critical' | 'attention' | 'ok'

export type ClientNextStep = {
  id: string
  title: string
  description: string
  ctaLabel: string
  to: string
  tone: ClientNextStepTone
  mayaIntentId: string
}

type PickClientNextStepInput = {
  overdueCount: number
  pendingRequestsCount: number
  unreadMessagesCount: number
  dueThisWeekCount: number
}

/**
 * Um único próximo passo — a prioridade é o que o escritório precisa agora,
 * não um calendário de datas.
 */
export function pickClientNextStep(input: PickClientNextStepInput): ClientNextStep {
  if (input.overdueCount > 0) {
    return {
      id: 'overdue',
      title: input.overdueCount === 1 ? 'Tem um prazo em atraso' : `Tem ${input.overdueCount} prazos em atraso`,
      description: 'Trate primeiro o que já passou da data. O detalhe e o que enviar estão em Prazos.',
      ctaLabel: 'Ver prazos',
      to: '/app/client/agenda',
      tone: 'critical',
      mayaIntentId: 'portal-deadlines',
    }
  }
  if (input.pendingRequestsCount > 0) {
    return {
      id: 'requests',
      title:
        input.pendingRequestsCount === 1
          ? 'O escritório pediu-lhe um documento'
          : `O escritório pediu-lhe ${input.pendingRequestsCount} documentos`,
      description: 'Abra Pedidos, envie o que falta e fica registado — sem espalhar por WhatsApp.',
      ctaLabel: 'Abrir pedidos',
      to: '/app/client/requests',
      tone: 'attention',
      mayaIntentId: 'portal-requests',
    }
  }
  if (input.unreadMessagesCount > 0) {
    return {
      id: 'messages',
      title:
        input.unreadMessagesCount === 1
          ? 'Tem uma mensagem nova'
          : `Tem ${input.unreadMessagesCount} mensagens novas`,
      description: 'A equipa do escritório escreveu-lhe. A conversa fica neste portal.',
      ctaLabel: 'Abrir mensagens',
      to: '/app/client/messages',
      tone: 'attention',
      mayaIntentId: 'portal-messages',
    }
  }
  if (input.dueThisWeekCount > 0) {
    return {
      id: 'this-week',
      title:
        input.dueThisWeekCount === 1
          ? 'Há um prazo esta semana'
          : `Há ${input.dueThisWeekCount} prazos esta semana`,
      description: 'Nada está atrasado. Confira o que vence nos próximos dias e o que precisa de enviar.',
      ctaLabel: 'Ver esta semana',
      to: '/app/client/agenda',
      tone: 'attention',
      mayaIntentId: 'portal-deadlines',
    }
  }
  return {
    id: 'clear',
    title: 'Tudo em dia por agora',
    description: 'Quando o escritório precisar de si, aparece aqui. Entretanto pode pedir um serviço ou escrever à equipa.',
    ctaLabel: 'Ver serviços',
    to: '/app/client/services',
    tone: 'ok',
    mayaIntentId: 'portal-services',
  }
}
