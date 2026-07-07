import type { ClientHubResponse } from '@/infrastructure/api/contabil/types'

export function fiscalHealthLabel(h: string) {
  if (h === 'critical') return 'Crítico'
  if (h === 'attention') return 'Atenção'
  return 'Saudável'
}

export function operationalStatusLabel(s: string) {
  if (s === 'critico') return 'Crítico'
  if (s === 'atencao') return 'Atenção'
  return 'Ativo'
}

export function deriveRiskReason(hub: ClientHubResponse): string {
  const { counts } = hub
  if (counts.obligationsOverdue > 0) {
    return `${counts.obligationsOverdue} obrigação(ões) em atraso`
  }
  if (counts.documentsPending > 0) {
    return `${counts.documentsPending} documento(s) por validar`
  }
  if (counts.tasksOpen > 3) {
    return `${counts.tasksOpen} tarefas em aberto`
  }
  if (hub.summary.fiscalHealth === 'attention') {
    return 'Prazos fiscais a aproximar-se'
  }
  if ((hub.alerts?.unread ?? 0) > 0) {
    return 'Alertas por ler no portal'
  }
  if (
    counts.obligationsOverdue === 0 &&
    counts.documentsPending === 0 &&
    counts.tasksOpen === 0 &&
    counts.unreadMessagesFromClient === 0 &&
    hub.summary.fiscalHealth === 'ok'
  ) {
    return 'Empresa sem sinais de risco — operação estável'
  }
  return 'Operação estável — sem sinais críticos'
}
