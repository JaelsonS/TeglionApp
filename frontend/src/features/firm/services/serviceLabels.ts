export const SERVICE_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Novo',
  ASSIGNED: 'Atribuído',
  QUOTED: 'Orçamentado',
  APPROVED: 'Aprovado',
  IN_PROGRESS: 'Em curso',
  DONE: 'Concluído',
  CANCELLED: 'Cancelado',
}

export const SERVICE_PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

export function servicePriorityClass(priority?: string) {
  if (priority === 'URGENT') return 'cb-services-priority-urgent'
  if (priority === 'HIGH') return 'cb-services-priority-high'
  return 'cb-services-priority-normal'
}
