export type PortalNotification = {
  id: string
  type?: string | null
  category?: string | null
  title: string
  readAt?: string | null
  createdAt?: string | null
  body?: string | null
  entityType?: string | null
  entityId?: string | null
  actionUrl?: string | null
}
