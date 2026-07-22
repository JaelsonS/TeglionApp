export type ObligationStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'WAITING_CLIENT'
  | 'DELIVERED'
  | 'OVERDUE'
  | 'CANCELLED'

export type ObligationType =
  | 'IVA'
  | 'IRC'
  | 'IRS'
  | 'SS'
  | 'DRF'
  | 'IES'
  | 'DAS'
  | 'PAYROLL'
  | 'SAFT'
  | 'CUSTOM'

export type OperationalLane =
  | 'critical'
  | 'upcoming'
  | 'overdue'
  | 'waiting_client'
  | 'completed'

export type ClientTaskStatus =
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'WAITING_CLIENT'
  | 'REVIEW'
  | 'DONE'
  | 'ARCHIVED'
  | 'OPEN'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'CANCELLED'

export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PROCESSING'
export type ObligationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type DocumentWorkflowStatus = 'SENT' | 'RECEIVED' | 'IN_ANALYSIS' | 'PROCESSED'

export type Obligation = {
  _id: string
  id?: string
  firmId: string
  clientId: string
  clientTaxId?: string | null
  recurrence?: string | null
  periodicity?: string | null
  type: ObligationType
  period: string
  title?: string | null
  dueDate: string
  status: ObligationStatus
  notes?: string | null
  deliveredAt?: string | null
  amountCents?: number | null
  currency?: string
  paymentStatus?: PaymentStatus
  priority?: ObligationPriority
  documentId?: string | null
  accountantNotes?: string | null
  viewCount?: number
  firstViewedAt?: string | null
  lastViewedAt?: string | null
  operationalLane?: OperationalLane
  clientName?: string | null
  templateId?: string | null
  checklist?: string[]
  expectedDocuments?: string[]
  assignedStaffId?: string | null
  paymentProofDocumentId?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type ContabilDocument = {
  _id: string
  obligationId?: string | null
  title?: string
  originalName?: string
  period?: string
  createdAt?: string
  validationStatus?: string
  workflowStatus?: DocumentWorkflowStatus
  category?: string
  tags?: string[]
  description?: string
  observations?: string
  uploadedByName?: string
  uploadedByRole?: string
  viewCount?: number
  lastViewedAt?: string | null
}

export type NewsArticle = {
  id: string
  _id?: string
  title: string
  slug: string
  excerpt?: string | null
  body: string
  coverUrl?: string | null
  /** Caminho no storage (para guardar); a API devolve URL assinada em coverUrl. */
  coverStorageKey?: string | null
  category?: string | null
  tags?: string[]
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'
  isFeatured?: boolean
  readingTimeMinutes?: number
  authorName?: string | null
  publishedAt?: string | null
  scheduledAt?: string | null
}

export type ClientTask = {
  _id: string
  firmId: string
  clientId: string
  obligationId?: string | null
  title: string
  description?: string | null
  status: ClientTaskStatus
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  dueDate?: string | null
  isOverdue?: boolean
  helpRequestedAt?: string | null
  submittedAt?: string | null
  /** internal_task = só escritório; nunca deve aparecer no portal cliente */
  taskType?: 'recurring_obligation' | 'manual_task' | 'internal_task'
}

export type FiscalHealth = 'ok' | 'attention' | 'critical'

export type DocumentRequestStatus = 'pending' | 'seen' | 'answered' | 'completed'

export type DocumentRequest = {
  id: string
  clientId: string
  conversationId?: string
  messageId?: string | null
  obligationId?: string | null
  periodMonth?: string | null
  title?: string | null
  instructions?: string | null
  status: DocumentRequestStatus
  seenAt?: string | null
  answeredAt?: string | null
  completedAt?: string | null
  documentId?: string | null
  createdAt: string
}

export type ContabilMessage = {
  id: string
  _id?: string
  conversationId?: string
  content?: string
  body: string
  senderType?: 'FIRM' | 'CLIENT'
  senderRole: 'FIRM' | 'CLIENT'
  createdAt: string
  readAt?: string | null
  isRead?: boolean
  quickReplyKey?: string | null
  attachmentStorageKey?: string | null
  attachmentName?: string | null
  attachmentMime?: string | null
  editedAt?: string | null
}

export type Consultation = {
  _id: string
  clientId: string
  staffId?: string | null
  title: string
  scheduledAt: string
  durationMinutes?: number
  status: string
  notes?: string | null
  accountingServiceId?: string | null
  priceCents?: number | null
  currency?: string | null
  source?: string | null
}

export type ContabilHubSummary = {
  period: string
  firm: {
    id: string
    name: string
    status?: string | null
    slug?: string | null
    logoUrl?: string | null
    contactPhone?: string | null
  }
  fiscalHealth?: FiscalHealth
  nextCriticalObligation?: Obligation | null
  counts: {
    obligationsOpen: number
    obligationsOverdue: number
    tasksOpen: number
    documents: number
    unreadMessages?: number
  }
  obligations: Obligation[]
  tasks: ClientTask[]
  documents: ContabilDocument[]
  recentMessages?: ContabilMessage[]
  historyPeriods: string[]
  /** Consultas futuras marcadas pelo portal ou escritório */
  upcomingConsultations?: Consultation[]
  /** Hub em modo de contingência (erro parcial no servidor). */
  degraded?: boolean
}

export type FirmContabilDashboard = {
  period: string
  totalClients: number
  portfolioHealth: {
    ok: number
    attention: number
    critical: number
    pctOk: number
    pctAttention: number
    pctCritical: number
  }
  obligations: {
    total: number
    overdue: number
    waitingClient: number
    currentPeriod: number
    delivered: number
  }
  tasksOpen: number
  tasksOpenWeek?: number
  tasksOpenToday?: number
  documentsThisMonth: number
  recentOverdue: Obligation[]
  recentWaiting: Obligation[]
  criticalNext48h: Obligation[]
  pendingValidationDocs: Array<{
    _id: string
    title?: string
    clientId: string
    clientName?: string | null
    period?: string
    createdAt?: string
  }>
  pendingValidationCount: number
  pendingValidationCountToday?: number
  pendingValidationCountWeek?: number
  inactiveClients: Array<{
    id: string
    displayName: string
    email?: string
    lastLoginAt?: string | null
  }>
  /** Próximas consultas agendadas (todas os clientes) */
  upcomingConsultations?: Array<{
    _id: string
    clientId: string
    clientName?: string
    title: string
    scheduledAt: string
    durationMinutes?: number
  }>
  avgResponseHours: number | null
}

export type MessageThread = {
  clientId: string
  clientName: string
  lastBody: string
  lastAt: string
  unread?: boolean
  unreadCount?: number
}

export type AccountingService = {
  id: string
  catalogKey?: string | null
  name: string
  description?: string | null
  durationMinutes: number
  priceCents: number
  currency?: string
  isActive?: boolean
  sortOrder?: number
}

export type ConsultingCatalogEntry = {
  catalogKey: string
  name: string
  description?: string
  durationMinutes: number
  priceCents: number
  category?: string
}

export type FirmBookingSettings = {
  slotMinutes: number
  horizonDays: number
  leadTimeHours: number
  weekdays: number[]
  dayStart: string
  dayEnd: string
  timezone?: string
}
