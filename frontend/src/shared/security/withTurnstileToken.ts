/** Garante token Turnstile quando o widget está activo no frontend. */
import { isTurnstileEnabled } from '@/shared/security/turnstile'

export function assertTurnstileToken(token: string | undefined | null): string | undefined {
  if (!isTurnstileEnabled()) return undefined
  const value = String(token || '').trim()
  if (!value) {
    throw new Error('Complete a verificação de segurança antes de continuar.')
  }
  return value
}

export function withTurnstileToken<T extends Record<string, unknown>>(
  payload: T,
  token: string | undefined | null,
): T & { turnstileToken?: string } {
  const turnstileToken = assertTurnstileToken(token)
  if (!turnstileToken) return payload
  return { ...payload, turnstileToken }
}
