import type { ClientFiscalProfile } from '@/infrastructure/api/contabil/types'

/** Cliente do escritório (portal + gestão). */
export type Client = {
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
  operationalStatus?: 'ativo' | 'atencao' | 'critico'
  pendingDocuments?: number
  pendingObligationsCount?: number
  openTasks?: number
  lastLoginAt?: string | null
  vatRegime?: string | null
  companyType?: 'Lda' | 'SA' | 'ENI' | string | null
  fiscalProfile?: ClientFiscalProfile | null
  nextObligation?: {
    id: string
    title?: string
    dueDate: string
    status: string
  } | null
}

export type ClientsListResponse = {
  items: Client[]
  page: number
  limit: number
  total: number
}
