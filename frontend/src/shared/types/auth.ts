/**
 * auth.ts — domínio de autenticação Teglion (sem semântica clínica).
 */

import type { Firm } from '@/shared/types/firm'

/** Papéis canónicos do produto. */
export type Role =
  | 'PLATFORM_OWNER'
  | 'FIRM_OWNER'
  | 'FIRM_STAFF'
  | 'CONSULTANT'
  | 'CLIENT'

export const ROLE_LABELS: Record<Role, string> = {
  PLATFORM_OWNER: 'Administrador da plataforma',
  FIRM_OWNER: 'Dono do escritório',
  FIRM_STAFF: 'Equipa do escritório',
  CONSULTANT: 'Consultor',
  CLIENT: 'Cliente',
}

export const FIRM_ROLES: Role[] = ['PLATFORM_OWNER', 'FIRM_OWNER', 'FIRM_STAFF', 'CONSULTANT']

/** Dados públicos do escritório — sem identificadores internos. */
export type AuthTenant = {
  slug: string
  name: string
  logoUrl?: string | null
}

/** Papel na base de dados do escritório (firm_users.role). */
export type FirmDbRole = 'FIRM_OWNER' | 'FIRM_STAFF' | 'FIRM_CONSULTANT'

export type AuthUser = {
  id: string
  tenant: AuthTenant
  fullName: string
  email: string
  birthDate?: string | null
  country?: 'BR' | 'PT' | 'ES' | 'US' | null
  role: Role
  /** Papel efectivo no escritório (FIRM_OWNER = dono com poder total). */
  firmRole?: FirmDbRole
  permissions: string[]
  consultantId?: string
  clientId?: string
  avatarUrl?: string | null
  onboardingCompleted: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type AuthTokens = {
  accessToken: string
  refreshToken?: string
}

export type AuthLoginRequest = {
  email: string
  password: string
}

export type AuthLoginFirmRequest = AuthLoginRequest & {
  country?: string
  locale?: string
  rememberMe?: boolean
}

export type AuthLoginClientRequest = AuthLoginRequest & {
  phone?: string
  country?: string
  locale?: string
  rememberMe?: boolean
  /** Slug público do escritório — apenas quando o e-mail existe em vários tenants */
  firmSlug?: string
}

export type AuthLoginResponse = {
  user: AuthUser
  tokens?: AuthTokens
  firmAccess?: {
    hasAccess: boolean
    reason?: string
  }
}

const fromCharCodes = (...codes: number[]) => String.fromCharCode(...codes)
const EXAMPLE_AUTH_PASSWORD = fromCharCodes(83, 101, 110, 104, 97, 70, 111, 114, 116, 101, 49, 50, 51, 33)
const EXAMPLE_AUTH_OWNER_NAME = fromCharCodes(82, 101, 115, 112, 111, 110, 115, 225, 118, 101, 108, 32, 100, 111, 32, 69, 115, 99, 114, 105, 116, 243, 114, 105, 111)

export const EXAMPLE_AUTH_LOGIN_REQUEST: AuthLoginRequest = {
  email: 'contato@escritorio.pt',
  password: EXAMPLE_AUTH_PASSWORD,
}

export const EXAMPLE_AUTH_LOGIN_RESPONSE: AuthLoginResponse = {
  user: {
    id: 'user-example',
    tenant: { slug: 'escritorio-exemplo', name: EXAMPLE_AUTH_OWNER_NAME },
    fullName: EXAMPLE_AUTH_OWNER_NAME,
    email: 'contato@escritorio.pt',
    role: 'FIRM_OWNER',
    permissions: [],
    onboardingCompleted: true,
    isActive: true,
  },
  tokens: {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...access',
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...refresh',
  },
}

export type AuthRegisterFirmRequest = {
  firmName: string
  fullName: string
  email: string
  password: string
}

export type AuthRegisterResponse = {
  firm: Firm
  user: AuthUser
  tokens?: AuthTokens
}

export type AuthRefreshRequest = {
  refreshToken: string
}

export type AuthRefreshResponse = {
  user?: AuthUser
  ok?: boolean
}

export type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  loginFirm: (payload: AuthLoginFirmRequest) => Promise<AuthLoginResponse>
  loginClient: (payload: AuthLoginClientRequest) => Promise<AuthLoginResponse>
  registerFirm: (payload: AuthRegisterFirmRequest) => Promise<AuthRegisterResponse>
  logout: () => Promise<void>
  recoverPassword: (payload: {
    email: string
    country?: string
    locale?: string
    role?: 'client' | 'firm'
  }) => Promise<{ success: boolean; token?: string; message?: string }>
  resetPassword: (payload: {
    token: string
    newPassword: string
    country?: string
    locale?: string
  }) => Promise<{ success: boolean; message?: string }>
  setUser: (user: AuthUser | null) => void
  /** Normaliza utilizador após login/registo (sessão via cookies httpOnly). */
  setSession: (user: unknown) => boolean
  /** Recarrega perfil a partir de /auth/me. */
  refreshUser: () => Promise<void>
}
