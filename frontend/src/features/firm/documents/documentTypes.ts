export type DocumentValidationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type DocumentGroupMode = 'none' | 'client' | 'period' | 'obligation'

export type DocumentSourceFilter = 'all' | 'firm' | 'client'

export type FirmDocumentRow = {
  _id: string
  id?: string
  title?: string
  originalName?: string
  period?: string
  createdAt?: string
  validatedAt?: string
  clientId?: string
  clientName?: string
  clientEmail?: string
  clientTaxId?: string
  obligationId?: string
  obligationTitle?: string
  obligationPeriod?: string
  validationStatus?: DocumentValidationStatus | string
  mimeType?: string
  sizeBytes?: number | null
  documentType?: string
  uploadedByRole?: string
  viewCount?: number
}

export type DocumentHistoryItem = {
  id: string
  kind?: string
  title?: string
  description?: string | null
  actorRole?: string
  createdAt?: string
}

export type DocumentsListResponse = {
  items?: FirmDocumentRow[]
  total?: number
  page?: number
  limit?: number
  hasMore?: boolean
}

export type DocumentDetailResponse = {
  document: FirmDocumentRow
  history?: DocumentHistoryItem[]
  views?: {
    totalViews?: number
    uniqueViewers?: number
    lastViewedAt?: string
  } | null
}

export type DocumentFilters = {
  period: string | null
  status: DocumentValidationStatus | null
  source: DocumentSourceFilter
  clientId: string | null
  obligationId: string | null
  group: DocumentGroupMode
  page: number
  docId: string | null
  q: string
}
