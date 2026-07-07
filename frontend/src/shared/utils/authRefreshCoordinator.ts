/**
 * Refresh de sessão coordenado entre abas (BroadcastChannel + lock em sessionStorage).
 * Evita rotação dupla do refresh token e logout cruzado.
 * Tokens ficam em cookies httpOnly — o canal só sinaliza sucesso/falha do refresh.
 */
import { logger } from '@/shared/utils/logger'

const CHANNEL_NAME = 'contabil-auth-refresh-v1'
const LOCK_KEY = 'contabil:auth-refresh-lock'
const LOCK_TTL_MS = 20_000
const TAB_ID =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`

type RefreshDoneMessage = {
  type: 'refresh-done'
  tabId: string
  success: boolean
  at: number
}

type RefreshStartMessage = {
  type: 'refresh-start'
  tabId: string
  at: number
}

type LogoutMessage = {
  type: 'logout'
  at: number
}

type AuthChannelMessage = RefreshDoneMessage | RefreshStartMessage | LogoutMessage

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null
  try {
    return new BroadcastChannel(CHANNEL_NAME)
  } catch {
    return null
  }
}

function readLock(): { tabId: string; at: number } | null {
  try {
    const raw = window.sessionStorage.getItem(LOCK_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { tabId?: string; at?: number }
    if (!parsed.tabId || !parsed.at) return null
    if (Date.now() - parsed.at > LOCK_TTL_MS) return null
    return { tabId: parsed.tabId, at: parsed.at }
  } catch {
    return null
  }
}

function writeLock() {
  try {
    window.sessionStorage.setItem(LOCK_KEY, JSON.stringify({ tabId: TAB_ID, at: Date.now() }))
  } catch {
    // noop
  }
}

function clearLock() {
  try {
    const lock = readLock()
    if (lock?.tabId === TAB_ID) window.sessionStorage.removeItem(LOCK_KEY)
  } catch {
    // noop
  }
}

function waitForPeerRefresh(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const channel = getChannel()
    let settled = false
    const finish = (success: boolean) => {
      if (settled) return
      settled = true
      channel?.close()
      window.clearTimeout(timer)
      resolve(success)
    }

    const timer = window.setTimeout(() => finish(false), timeoutMs)

    if (!channel) {
      const poll = window.setInterval(() => {
        const lock = readLock()
        if (!lock) {
          window.clearInterval(poll)
          finish(false)
        }
      }, 200)
      window.setTimeout(() => window.clearInterval(poll), timeoutMs)
      return
    }

    channel.onmessage = (event: MessageEvent<AuthChannelMessage>) => {
      const data = event.data
      if (data?.type === 'refresh-done') {
        finish(Boolean(data.success))
      }
      if (data?.type === 'logout') {
        finish(false)
      }
    }
  })
}

function broadcast(message: AuthChannelMessage) {
  const channel = getChannel()
  if (!channel) return
  try {
    channel.postMessage(message)
    channel.close()
  } catch {
    // noop
  }
}

export function broadcastAuthLogout() {
  broadcast({ type: 'logout', at: Date.now() })
  clearLock()
}

export function subscribeAuthChannel(handlers: {
  onSessionRefreshed?: () => void
  onLogout?: () => void
}): () => void {
  const channel = getChannel()
  if (!channel) return () => {}

  channel.onmessage = (event: MessageEvent<AuthChannelMessage>) => {
    const data = event.data
    if (data?.type === 'refresh-done' && data.success) {
      handlers.onSessionRefreshed?.()
    }
    if (data?.type === 'logout') {
      handlers.onLogout?.()
    }
  }

  return () => {
    try {
      channel.close()
    } catch {
      // noop
    }
  }
}

/**
 * Executa refresh HTTP uma vez por cluster de abas; outras abas aguardam o resultado.
 */
export async function coordinatedAuthRefresh(refreshHttp: () => Promise<void>): Promise<boolean> {
  const existingLock = readLock()
  if (existingLock && existingLock.tabId !== TAB_ID) {
    logger.info('[auth] Aguardar refresh de outra aba', { owner: existingLock.tabId })
    return waitForPeerRefresh(LOCK_TTL_MS)
  }

  writeLock()
  broadcast({ type: 'refresh-start', tabId: TAB_ID, at: Date.now() })

  try {
    await refreshHttp()
    broadcast({ type: 'refresh-done', tabId: TAB_ID, success: true, at: Date.now() })
    return true
  } catch (err) {
    broadcast({ type: 'refresh-done', tabId: TAB_ID, success: false, at: Date.now() })
    throw err
  } finally {
    clearLock()
  }
}
