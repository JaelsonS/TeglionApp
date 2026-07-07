import { prefetchAuthCsrf, warmupAuthApi } from '@/infrastructure/api'
import { AUTH_REQUEST_TIMEOUT_MS, isNoResponseError, withManualTimeout } from '@/shared/utils/requestTimeout'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

/** Pré-aquece CSRF + health da API ao abrir páginas de login (cold start Render). */
export async function warmupAuthLoginPage(): Promise<void> {
  await Promise.allSettled([prefetchAuthCsrf(), warmupAuthApi()])
}

/** Repete pedidos de login quando a API ainda não responde (cold start). */
export async function withAuthLoginRetry<T>(
  fn: () => Promise<T>,
  options?: { maxAttempts?: number; baseDelayMs?: number },
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3
  const baseDelayMs = options?.baseDelayMs ?? 2000
  let lastErr: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await withManualTimeout(fn(), AUTH_REQUEST_TIMEOUT_MS)
    } catch (err) {
      lastErr = err
      if (!isNoResponseError(err) || attempt === maxAttempts) throw err
      await sleep(baseDelayMs * attempt)
    }
  }

  throw lastErr
}
