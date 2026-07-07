export type DocumentRequestStatus = 'pending' | 'seen' | 'answered' | 'completed'

const LEGACY_MAP: Record<string, DocumentRequestStatus> = {
  PENDING: 'pending',
  SEEN: 'seen',
  RESPONDED: 'answered',
  COMPLETED: 'completed',
}

export function normalizeRequestStatus(raw?: string | null): DocumentRequestStatus | null {
  if (!raw) return null
  const lower = String(raw).toLowerCase() as DocumentRequestStatus
  if (['pending', 'seen', 'answered', 'completed'].includes(lower)) return lower
  return LEGACY_MAP[String(raw).toUpperCase()] || null
}

export const REQUEST_STATUS_LABEL: Record<DocumentRequestStatus, string> = {
  pending: 'Pendente',
  seen: 'Visto',
  answered: 'Respondido',
  completed: 'Concluído',
}

export const REQUEST_STATUS_CLASS: Record<DocumentRequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  seen: 'bg-sky-100 text-sky-900 border-sky-200',
  answered: 'bg-violet-100 text-violet-900 border-violet-200',
  completed: 'bg-emerald-100 text-emerald-900 border-emerald-200',
}

/** Índice do passo activo no stepper (0–4): Criado → Enviado → Aguarda resp. → Em revisão → Concluído */
export function documentRequestStepIndex(status: DocumentRequestStatus | null): number {
  switch (status) {
    case 'completed':
      return 4
    case 'answered':
      return 3
    case 'seen':
    case 'pending':
      return 2
    default:
      return 0
  }
}
