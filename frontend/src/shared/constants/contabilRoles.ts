/**
 * Papéis TegLion — alinhados com `Role` em `@/shared/types/auth`.
 */

import type { Role } from '@/shared/types/auth'

export type ContabilRole = 'FIRM_OWNER' | 'FIRM_STAFF' | 'FIRM_CONSULTANT' | 'CLIENT_USER'

export const CONTABIL_ROLE_LABELS: Record<ContabilRole, string> = {
  FIRM_OWNER: 'Dono do escritório',
  FIRM_STAFF: 'Equipa do escritório',
  FIRM_CONSULTANT: 'Consultor',
  CLIENT_USER: 'Cliente',
}

export function roleToContabilRole(role: Role | string | undefined | null): ContabilRole | null {
  switch (role) {
    case 'PLATFORM_OWNER':
    case 'FIRM_OWNER':
      return 'FIRM_OWNER'
    case 'FIRM_STAFF':
      return 'FIRM_STAFF'
    case 'CONSULTANT':
      return 'FIRM_CONSULTANT'
    case 'CLIENT':
      return 'CLIENT_USER'
    default:
      return null
  }
}

export const FIRM_APP_ROLES: readonly Role[] = [
  'PLATFORM_OWNER',
  'FIRM_OWNER',
  'FIRM_STAFF',
  'CONSULTANT',
]
