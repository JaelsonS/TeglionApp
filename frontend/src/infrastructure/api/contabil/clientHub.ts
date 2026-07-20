import { contabilClientsApi } from '@/infrastructure/api'

import type { ClientFiscalProfile, ClientHubResponse, ClientHubTimelineItem } from './types'

export async function fetchClientHub(clientId: string): Promise<ClientHubResponse> {
  return contabilClientsApi.getHub(clientId) as Promise<ClientHubResponse>
}

export type ActivityHistoryParams = {
  from?: string
  to?: string
  kind?: string
  q?: string
  hidden?: 'all' | 'visible' | 'hidden'
  page?: number
  limit?: number
}

export async function fetchClientActivityHistory(
  clientId: string,
  params?: ActivityHistoryParams,
): Promise<{ items: ClientHubTimelineItem[]; total: number; page: number; limit: number }> {
  return contabilClientsApi.listActivityHistory(clientId, params)
}

export async function hideClientActivity(
  clientId: string,
  activityId: string,
): Promise<{ item: ClientHubTimelineItem }> {
  return contabilClientsApi.hideActivity(clientId, activityId)
}

export async function unhideClientActivity(
  clientId: string,
  activityId: string,
): Promise<{ item: ClientHubTimelineItem }> {
  return contabilClientsApi.unhideActivity(clientId, activityId)
}

export async function hideAllClientFeedActivity(clientId: string): Promise<{ hidden: number }> {
  return contabilClientsApi.hideAllFeedActivity(clientId)
}

export async function patchClient(
  clientId: string,
  payload: {
    displayName?: string
    email?: string | null
    phone?: string | null
    taxId?: string | null
    assignedStaffId?: string | null
    metadata?: Partial<ClientFiscalProfile>
  },
): Promise<{ client: ClientHubResponse['client']; changes: unknown[] }> {
  return contabilClientsApi.patch(clientId, payload) as Promise<{
    client: ClientHubResponse['client']
    changes: unknown[]
  }>
}
