/** Tipos canónicos da API TegLion (domínio escritório). */

export type ClientOperationalStatus = 'ativo' | 'atencao' | 'critico'

export type ContabilClient = {
  _id: string
  id?: string
  firmId?: string
  displayName?: string
  name: string
  fullName?: string | null
  email?: string | null
  phone?: string | null
  taxId?: string | null
  status?: string
  metadata?: Record<string, unknown>
  operationalStatus?: ClientOperationalStatus
  pendingDocuments?: number
  openTasks?: number
  lastLoginAt?: string | null
  nextObligation?: {
    id: string
    title?: string
    dueDate: string
    status: string
  } | null
}

export type ClientsListResponse = {
  items: ContabilClient[]
  page: number
  limit: number
  total: number
}

export type ClientDetailResponse = {
  client: ContabilClient
}

export type ClientFiscalProfile = {
  clientType?:
  | 'COMPANY'
  | 'SELF_EMPLOYED'
  | 'INDIVIDUAL'
  | 'Empresa'
  | 'Independente'
  | 'Particular'
  | 'Trabalhador Independente'
  | null
  legalForm?: string | null
  accountingType?: 'Contabilidade Organizada' | 'Regime Simples' | null
  legalName?: string | null
  services?: string[]
  address:
  | string
  | {
    street?: string | null
    district?: string | null
    municipality?: string | null
    parish?: string | null
    postalCode?: string | null
    formatted?: string
  }
  | null
  caePrimary: string | null
  caeSecondary: string[]
  shareCapital: string | null
  incorporationDate: string | null
  activityStartDate?: string | null
  vatRegime: string | null
  vatExemptionReason?: string | null
  irsFramework: string | null
  socialSecurity?: {
    area?: string | null
    oneYearExemption?: boolean | null
    startDate?: string | null
    quarterlyDeclaration?: boolean | null
  }
  identification?: {
    spouse?: boolean | null
    irsDelivery?: boolean | null
    validateEInvoice?: boolean | null
    communicateHousehold?: boolean | null
  }
  contacts: Array<{
    name?: string | null
    role?: string | null
    phone?: string | null
    email?: string | null
  }>
  notes: string | null
  assignedStaffLabel: string | null
}

export type ClientHubTimelineItem = {
  id: string
  kind: 'message' | 'document' | 'task' | 'obligation' | 'profile' | 'alert' | 'activity'
  at: string
  title: string
  description?: string | null
  actorRole?: string
  actorName?: string
  entityType?: string
  entityId?: string
  eventType?: string
  /** @deprecated use hideable — kept for older payloads */
  deletable?: boolean
  hideable?: boolean
  activityId?: string
  hiddenFromFeed?: boolean
  hiddenFromFeedAt?: string | null
}

/** Alias UI — a API mantém o campo `timeline` e o tipo `ClientHubTimelineItem`. */
export type ClientHubHistoryItem = ClientHubTimelineItem

export type ClientHubResponse = {
  client: ContabilClient & { fiscalProfile: ClientFiscalProfile }
  summary: {
    operationalStatus: ClientOperationalStatus
    fiscalHealth: 'ok' | 'attention' | 'critical'
    riskScore: number
  }
  counts: {
    obligationsOpen: number
    obligationsOverdue: number
    tasksOpen: number
    documentsPending: number
    unreadMessagesFromClient: number
  }
  cards: {
    upcomingDeadlines: Array<{
      id: string
      title: string
      type: string
      dueDate: string
      status: string
      priority?: string
    }>
    criticalTasks: Array<{ id: string; title: string; status: string; dueDate?: string }>
    pendingDocuments: Array<{ id: string; title: string; period?: string; createdAt?: string }>
    lastInteraction: { at: string; preview: string; from: string } | null
  }
  timeline: ClientHubTimelineItem[]
  profileHistory: Array<{
    id: string
    title: string
    createdAt: string
    metadata?: { changes?: Array<{ field: string; label: string }> }
  }>
  recentActivity: unknown[]
  alerts?: {
    unread: number
    urgent: number
    items: Array<{
      id: string
      title: string
      priority: string
      category: string
      dueAt?: string | null
      isRead?: boolean
      needsAck?: boolean
      pinned?: boolean
    }>
  }
}

