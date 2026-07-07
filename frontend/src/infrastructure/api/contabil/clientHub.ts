import { contabilClientsApi } from '@/infrastructure/api'

import type { ClientFiscalProfile, ClientHubResponse } from './types'

export async function fetchClientHub(clientId: string): Promise<ClientHubResponse> {
  return contabilClientsApi.getHub(clientId) as Promise<ClientHubResponse>
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
