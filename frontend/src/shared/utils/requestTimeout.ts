import axios from 'axios'

export const AUTH_REQUEST_TIMEOUT_MS = 18000
const MANUAL_TIMEOUT_CODE = 'MANUAL_TIMEOUT'

export class ManualTimeoutError extends Error {
  code = MANUAL_TIMEOUT_CODE

  constructor(message = 'Request timed out') {
    super(message)
    this.name = 'ManualTimeoutError'
  }
}

export function withManualTimeout<T>(promise: Promise<T>, timeoutMs = AUTH_REQUEST_TIMEOUT_MS): Promise<T> {
  let timerId: number | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = window.setTimeout(() => reject(new ManualTimeoutError()), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timerId !== null) window.clearTimeout(timerId)
  }) as Promise<T>
}

export function isManualTimeoutError(err: unknown): boolean {
  return Boolean((err as { code?: string })?.code === MANUAL_TIMEOUT_CODE)
}

export function isNoResponseError(err: unknown): boolean {
  if (isManualTimeoutError(err)) return true
  if (axios.isAxiosError(err)) return !err.response
  const message = String((err as { message?: string })?.message || '')
  return message.includes('Network Error') || message.includes('Failed to fetch')
}
