import type { ClientHubTimelineItem } from '@/infrastructure/api/contabil/types'
import { firmTasksPath } from '@/features/firm/tasks/firmTasksPaths'
import { CLIENT_QUERY_KEY } from '@/shared/utils/clientQueryParam'

export type ActivityNavTarget =
  | { type: 'href'; href: string }
  | { type: 'profile' }

function entityIdFromItem(item: ClientHubTimelineItem): string | null {
  const direct = String(item.entityId || '').trim()
  if (direct) return direct

  const id = String(item.id || '')
  const prefixes = ['document-', 'message-', 'task-', 'obligation-'] as const
  for (const prefix of prefixes) {
    if (id.startsWith(prefix)) {
      const rest = id.slice(prefix.length).trim()
      if (rest) return rest
    }
  }
  return null
}

function withQuery(path: string, params: Record<string, string | null | undefined>): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue
    qs.set(key, value)
  }
  const q = qs.toString()
  if (!q) return path
  return `${path}?${q}`
}

/**
 * Resolve where a hub timeline item should open.
 * Returns null when the item is not navigable.
 */
export function resolveActivityNav(
  clientId: string,
  item: ClientHubTimelineItem,
): ActivityNavTarget | null {
  const cid = String(clientId || '').trim()
  if (!cid) return null

  if (item.kind === 'profile') {
    return { type: 'profile' }
  }

  const entityId = entityIdFromItem(item)

  if (item.kind === 'document' && entityId) {
    return {
      type: 'href',
      href: withQuery('/app/firm/documents/files', {
        doc: entityId,
        [CLIENT_QUERY_KEY]: cid,
      }),
    }
  }

  if (item.kind === 'task' && entityId) {
    return {
      type: 'href',
      href: withQuery(firmTasksPath('manual'), {
        task: entityId,
        [CLIENT_QUERY_KEY]: cid,
      }),
    }
  }

  if (item.kind === 'obligation' && entityId) {
    return {
      type: 'href',
      href: withQuery(firmTasksPath('obligations'), {
        // Hub + TaskDetail use `ob`; calendar historically used `obligation`.
        ob: entityId,
        [CLIENT_QUERY_KEY]: cid,
      }),
    }
  }

  if (item.kind === 'message') {
    return {
      type: 'href',
      href: withQuery('/app/firm/messages', {
        client: cid,
        ...(entityId ? { message: entityId } : {}),
      }),
    }
  }

  // Generic activity/alert with a known entity type from the audit feed
  if (entityId && item.entityType) {
    const t = String(item.entityType).toUpperCase()
    if (t.includes('DOCUMENT')) {
      return {
        type: 'href',
        href: withQuery('/app/firm/documents/files', {
          doc: entityId,
          [CLIENT_QUERY_KEY]: cid,
        }),
      }
    }
    if (t.includes('TASK')) {
      return {
        type: 'href',
        href: withQuery(firmTasksPath('manual'), {
          task: entityId,
          [CLIENT_QUERY_KEY]: cid,
        }),
      }
    }
    if (t.includes('OBLIGATION')) {
      return {
        type: 'href',
        href: withQuery(firmTasksPath('obligations'), {
          ob: entityId,
          [CLIENT_QUERY_KEY]: cid,
        }),
      }
    }
    if (t.includes('MESSAGE')) {
      return {
        type: 'href',
        href: withQuery('/app/firm/messages', { client: cid, message: entityId }),
      }
    }
  }

  return null
}

export function activityItemIsNavigable(clientId: string, item: ClientHubTimelineItem): boolean {
  return resolveActivityNav(clientId, item) != null
}
