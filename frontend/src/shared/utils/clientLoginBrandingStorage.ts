import type { AuthTenant } from '@/shared/types/auth'

const STORAGE_KEY = 'contabil:clientLoginBranding'

export type ClientLoginBranding = Pick<AuthTenant, 'slug' | 'name' | 'logoUrl'>

export function writeClientLoginBranding(tenant: ClientLoginBranding | null | undefined) {
  if (typeof window === 'undefined' || !tenant?.slug || !tenant.name) return
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        slug: tenant.slug,
        name: tenant.name,
        logoUrl: tenant.logoUrl ?? null,
      }),
    )
  } catch {
    /* ignore */
  }
}

export function readClientLoginBranding(): ClientLoginBranding | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as ClientLoginBranding
    if (!parsed?.slug || !parsed?.name) return undefined
    return parsed
  } catch {
    return undefined
  }
}

export function clearClientLoginBranding() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
