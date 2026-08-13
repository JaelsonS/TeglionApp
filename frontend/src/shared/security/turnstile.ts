/**
 * Actions Cloudflare Turnstile — devem coincidir com o backend
 * (`backend/src/services/turnstile/turnstile-actions.js`).
 */
export const TURNSTILE_ACTIONS = {
  LOGIN_FIRM: 'login-firm',
  LOGIN_CLIENT: 'login-client',
  RECOVER: 'recover',
  RESET_PASSWORD: 'reset-password',
  REGISTER_FIRM: 'register-firm',
  REGISTER_FIRM_GOOGLE: 'register-firm-google',
  REGISTER_CLIENT_INVITE: 'register-client-invite',
  TEAM_INVITE_ACCEPT: 'team-invite-accept',
  INTAKE_LEAD: 'intake-lead',
  INTAKE_SUBMIT: 'intake-submit',
  SUPPORT: 'support',
  NEWSLETTER: 'newsletter',
  PORTAL_UPLOAD: 'portal-upload',
  PORTAL_REPLY: 'portal-reply',
} as const

export type TurnstileAction = (typeof TURNSTILE_ACTIONS)[keyof typeof TURNSTILE_ACTIONS]

export function getTurnstileSiteKey(): string {
  return String(import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim()
}

/** Widget activo quando a sitekey pública está definida (produção / staging com keys). */
export function isTurnstileEnabled(): boolean {
  return Boolean(getTurnstileSiteKey())
}
