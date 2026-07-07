/** Rotas de autenticação TegLion (firm vs client). */

export type AuthIntent = 'login' | 'register' | 'trial'
export type AuthProfile = 'firm' | 'client'

export const AUTH_PROFILE_CHOICE_PATH = '/auth'

export function authProfileChoiceUrl(intent: AuthIntent = 'login') {
  return `${AUTH_PROFILE_CHOICE_PATH}?intent=${encodeURIComponent(intent)}`
}

export function authFirmLoginUrl() {
  return '/auth/firm/login'
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
