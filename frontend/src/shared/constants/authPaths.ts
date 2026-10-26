/** Rotas de autenticação Teglion (firm vs client vs Control Center). */

export type AuthIntent = 'login' | 'register' | 'trial'
export type AuthProfile = 'firm' | 'client'

export const AUTH_PROFILE_CHOICE_PATH = '/auth'

export function authProfileChoiceUrl(intent: AuthIntent = 'login') {
  return `${AUTH_PROFILE_CHOICE_PATH}?intent=${encodeURIComponent(intent)}`
}

export function authFirmLoginUrl() {
  return '/auth/firm/login'
}

/** Login dedicado do Teglion Control Center (não misturar com gabinetes). */
export function authOpsLoginUrl() {
  return '/auth/ops/login'
}

export function authOpsMfaUrl(reason: 'challenge' | 'enroll' = 'challenge') {
  return `/auth/ops/mfa?reason=${encodeURIComponent(reason)}`
}

export function authFirmRegisterUrl() {
  return '/auth/firm/register'
}

export function authFirmRegisterGoogleUrl() {
  return '/auth/firm/register/google'
}

export function authClientLoginUrl(firmSlug?: string | null) {
  if (firmSlug) {
    return `/auth/client/login?firmSlug=${encodeURIComponent(firmSlug)}`
  }
  return '/auth/client/login'
}

export function authClientRegisterUrl() {
  return '/auth/client/register'
}

export function resolveAuthTarget(intent: AuthIntent, profile: AuthProfile) {
  if (profile === 'firm') {
    if (intent === 'register' || intent === 'trial') return authFirmRegisterUrl()
    return authFirmLoginUrl()
  }
  if (intent === 'register') return authClientRegisterUrl()
  return authClientLoginUrl()
}
