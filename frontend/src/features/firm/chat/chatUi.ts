export type ChatListFilter = 'todos' | 'unread' | 'pinned'

const PINNED_STORAGE_PREFIX = 'cb-firm-chat-pinned:'

const AVATAR_PALETTE: Array<{ bg: string; text: string }> = [
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-sky-100', text: 'text-sky-700' },
  { bg: 'bg-amber-100', text: 'text-amber-800' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  { bg: 'bg-orange-100', text: 'text-orange-800' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
]

function hashId(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i += 1) h = (h + id.charCodeAt(i) * 31) % 997
  return h
}

export function chatClientInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (parts[0]?.slice(0, 2) || '?').toUpperCase()
}

export function chatAvatarPalette(clientId: string) {
  return AVATAR_PALETTE[hashId(clientId) % AVATAR_PALETTE.length]
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function formatChatThreadTime(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  if (isSameDay(d, now)) {
    return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays < 7) {
    return d.toLocaleDateString('pt-PT', { weekday: 'short' })
  }
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
}

export function formatChatMessageTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

export function isClientOnline(lastLoginAt?: string | null) {
  if (!lastLoginAt) return false
  const then = new Date(lastLoginAt).getTime()
  if (Number.isNaN(then)) return false
  return Date.now() - then < 15 * 60 * 1000
}

export function getPinnedClientIds(tenantSlug: string): string[] {
  if (!tenantSlug || typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(`${PINNED_STORAGE_PREFIX}${tenantSlug}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function togglePinnedClientId(tenantSlug: string, clientId: string): string[] {
  const current = new Set(getPinnedClientIds(tenantSlug))
  if (current.has(clientId)) current.delete(clientId)
  else current.add(clientId)
  const next = [...current]
  if (typeof window !== 'undefined' && tenantSlug) {
    window.localStorage.setItem(`${PINNED_STORAGE_PREFIX}${tenantSlug}`, JSON.stringify(next))
  }
  return next
}

export function previewLastMessage(body?: string | null, attachmentName?: string | null) {
  const text = String(body || '').trim()
  if (text) return text.length > 72 ? `${text.slice(0, 72)}…` : text
  if (attachmentName) return `📎 ${attachmentName}`
  return 'Sem mensagens'
}

export function formatFileSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
