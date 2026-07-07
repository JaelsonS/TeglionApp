import { isAxiosError } from 'axios'

let globalPauseUntil = 0

export function getRateLimitBackoffMs(error: unknown, fallbackMs = 60_000): number {
  if (!isAxiosError(error) || error.response?.status !== 429) return 0
  const raw = error.response.headers?.['retry-after'] ?? error.response.headers?.['Retry-After']
  const sec = typeof raw === 'string' ? Number.parseInt(raw, 10) : typeof raw === 'number' ? raw : Number.NaN
  if (Number.isFinite(sec) && sec > 0) return Math.min(Math.max(sec, 1), 300) * 1000
  return fallbackMs
}

export function isTooManyRequests(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 429
}

/** Pausa refetches globais após 429 (evita tempestade de pedidos). */
export function pauseQueriesAfterRateLimit(ms: number): void {
  if (ms <= 0) return
  globalPauseUntil = Math.max(globalPauseUntil, Date.now() + ms)
}

export function isQueriesPausedByRateLimit(): boolean {
  return Date.now() < globalPauseUntil
}
