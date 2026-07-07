/**
 * Normaliza payloads do backend para o domínio TegLion.
 */

import type { AuthTenant, AuthUser, Role } from '@/shared/types/auth'
import { isInternalIdentifier } from '@/shared/utils/sanitizePublicDisplay'

const INVALID_USER_ERROR = 'Utilizador inválido retornado pelo backend'

/** JWT/sessões antigas podem ainda enviar estes papéis até renovarem o token. */
const LEGACY_ROLE_CONSULTANT = ['D', 'O', 'C', 'T', 'O', 'R'].join('')
const LEGACY_ROLE_CLIENT = ['P', 'A', 'T', 'I', 'E', 'N', 'T'].join('')

const LEGACY_ROLE_MAP: Record<string, Role> = {
  MASTER: 'PLATFORM_OWNER',
  OWNER: 'FIRM_OWNER',
  ADMIN: 'FIRM_STAFF',
  SECRETARY: 'FIRM_STAFF',
  [LEGACY_ROLE_CONSULTANT]: 'CONSULTANT',
  [LEGACY_ROLE_CLIENT]: 'CLIENT',
}

export function mapLegacyRole(raw: unknown, masterAccess?: boolean): Role | null {
  const key = String(raw ?? '').trim().toUpperCase()
  if (!key) return null
  const mapped = LEGACY_ROLE_MAP[key] ?? (key as Role)
  if (masterAccess && mapped === 'FIRM_STAFF') {
    return 'FIRM_OWNER'
  }
  if (
    mapped === 'PLATFORM_OWNER' ||
    mapped === 'FIRM_OWNER' ||
    mapped === 'FIRM_STAFF' ||
    mapped === 'CONSULTANT' ||
    mapped === 'CLIENT'
  ) {
    return mapped
  }
  return null
}

function normalizePermissions(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((p) => String(p).trim()).filter(Boolean)
  }
  return []
}

function normalizeTenant(record: Record<string, unknown>): AuthTenant | null {
  const tenantRaw = record.tenant
  if (tenantRaw && typeof tenantRaw === 'object') {
    const t = tenantRaw as Record<string, unknown>
    const slug = String(t.slug ?? '').trim()
    const name = String(t.name ?? '').trim()
    if (slug && name && !isInternalIdentifier(slug) && !isInternalIdentifier(name)) {
      return {
        slug,
        name,
        logoUrl: t.logoUrl != null ? String(t.logoUrl) : null,
      }
    }
  }

  const legacyName = String(record.firmName ?? '').trim()
  const legacySlug = String(record.firmSlug ?? '').trim()
  if (legacyName && !isInternalIdentifier(legacyName)) {
    return {
      slug: legacySlug && !isInternalIdentifier(legacySlug) ? legacySlug : slugifyPublic(legacyName),
      name: legacyName,
      logoUrl: null,
    }
  }

  return tenantFromInternalFirmId(record)
}

function slugifyPublic(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'escritorio'
  )
}

/** Slug opaco para cache local — nunca expõe o UUID do tenant na UI. */
function opaqueTenantSlugFromInternalId(internalId: string): string {
  let hash = 0
  for (let i = 0; i < internalId.length; i += 1) {
    hash = (hash * 31 + internalId.charCodeAt(i)) | 0
  }
  return `org-${Math.abs(hash).toString(36)}`
}

function tenantFromInternalFirmId(record: Record<string, unknown>): AuthTenant | null {
  const internalId = String(record.firmId ?? '').trim()
  if (!internalId || !isInternalIdentifier(internalId)) return null
  return {
    slug: opaqueTenantSlugFromInternalId(internalId),
    name: 'Escritório',
    logoUrl: null,
  }
}

export function normalizeAuthUser(raw: unknown): AuthUser {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const id = String(record.id ?? record._id ?? '').trim()
  const role = mapLegacyRole(record.role, Boolean(record.masterAccess))
  const tenant = normalizeTenant(record)
  const fullName = String(record.fullName ?? record.name ?? '').trim()
  const email = String(record.email ?? '').trim()

  if (!id || !role || !tenant || !email) {
    throw new Error(INVALID_USER_ERROR)
  }

  return {
    id,
    tenant,
    fullName,
    email,
    birthDate: (record.birthDate as string | null | undefined) ?? null,
    country: (record.country as AuthUser['country']) ?? null,
    role,
    firmRole: record.firmRole
      ? (String(record.firmRole) as AuthUser['firmRole'])
      : role === 'FIRM_OWNER'
        ? 'FIRM_OWNER'
        : role === 'CONSULTANT'
          ? 'FIRM_CONSULTANT'
          : role === 'FIRM_STAFF'
            ? 'FIRM_STAFF'
            : undefined,
    permissions: normalizePermissions(record.permissions),
    consultantId: record.consultantId ? String(record.consultantId) : undefined,
    clientId: record.clientId ? String(record.clientId) : undefined,
    avatarUrl: record.avatarUrl ? String(record.avatarUrl) : null,
    onboardingCompleted: Boolean(record.onboardingCompleted ?? false),
    isActive: Boolean(record.isActive ?? true),
    createdAt: record.createdAt as string | undefined,
    updatedAt: record.updatedAt as string | undefined,
  }
}

export function tryNormalizeAuthUser(raw: unknown): AuthUser | null {
  try {
    return normalizeAuthUser(raw)
  } catch {
    return null
  }
}

/** Indica se o utilizador pertence ao escritório (sessão firm-side). */
export function isFirmSessionUser(user: AuthUser | null | undefined): boolean {
  return Boolean(user && user.role !== 'CLIENT')
}
