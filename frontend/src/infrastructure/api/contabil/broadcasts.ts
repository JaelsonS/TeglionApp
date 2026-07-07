import { contabilBroadcastsApi, clientPortalContabilApi } from '@/infrastructure/api'

export type BroadcastPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type BroadcastStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'

export type BroadcastAttachment = {
  url: string
  name?: string
  mimeType?: string
  storageKey?: string
  type?: 'image' | 'file'
}

export type FirmBroadcast = {
  id: string
  _id?: string
  title: string
  slug: string
  excerpt?: string | null
  body: string
  category: string
  priority: BroadcastPriority
  attachments?: BroadcastAttachment[]
  coverUrl?: string | null
  dueAt?: string | null
  scheduledAt?: string | null
  publishedAt?: string | null
  expiresAt?: string | null
  status: BroadcastStatus
  targetType: 'ALL_CLIENTS' | 'SELECTED'
  targetClientIds?: string[]
  ctaLabel?: string | null
  ctaUrl?: string | null
  pinned?: boolean
  readConfirmationRequired?: boolean
  deliveryCount?: number
  readCount?: number
  ackCount?: number
  authorName?: string | null
}

export type ClientAlertItem = FirmBroadcast & {
  readAt?: string | null
  isRead?: boolean
  needsAck?: boolean
}

export async function fetchBroadcastsMeta() {
  return contabilBroadcastsApi.getMeta() as Promise<{
    categories: Array<{ id: string; label: string }>
    priorities: string[]
    templates: Array<Record<string, unknown>>
  }>
}

export async function fetchFirmBroadcasts(params?: {
  status?: string
  category?: string
  priority?: string
  search?: string
  page?: number
  limit?: number
}) {
  return contabilBroadcastsApi.list(params) as Promise<{ items: FirmBroadcast[]; total: number }>
}

export async function fetchBroadcastAnalytics(id: string) {
  return contabilBroadcastsApi.getAnalytics(id)
}

export async function fetchClientAlerts(params?: { category?: string; search?: string }) {
  return clientPortalContabilApi.listAlerts(params) as Promise<{
    items: ClientAlertItem[]
    pinned: ClientAlertItem[]
    urgentBanner: ClientAlertItem | null
    unreadCount: number
  }>
}
