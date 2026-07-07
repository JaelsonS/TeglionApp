import React, { createContext, useCallback, useMemo, useState, useEffect } from 'react'

import { contabilFirmApi, toPublicAssetUrl, clientPortalContabilApi } from '@/infrastructure/api'
import { isContabilMode } from '@/shared/config/productMode'
import type { Firm } from '@/shared/types/firm'
import { useAuth } from '@/shared/hooks/useAuth'
import { applyFirmBranding } from '@/shared/utils/firmBranding'
import { onAppDataChanged } from '@/shared/utils/appEvents'
import { isFirmSessionUser } from '@/shared/utils/authNormalize'
import { readFirmBrandingCache, writeFirmBrandingCache } from '@/shared/utils/firmBrandingCache'
import i18n from '@/i18n'
import { APP_LOCALE_STORAGE_KEY, normalizeAppLocale } from '@/shared/i18n/appLocale'
import { countryToLocale, resolveFirmCountry } from '@/shared/utils/firmLocale'

type FirmBrandingContextValue = {
  firm: Firm | null
  firmLogoUrl: string | null
  isLoading: boolean
  refresh: (opts?: { force?: boolean }) => Promise<void>
}

export const FirmBrandingContext = createContext<FirmBrandingContextValue | null>(null)

let firmCache: { cacheKey: string; firm: Firm | null; logoUrl: string | null } | null = null

function firmFromTenant(tenant: { slug: string; name: string; logoUrl?: string | null }): Firm {
  return {
    name: tenant.name,
    slug: tenant.slug,
    branding: { logoUrl: tenant.logoUrl ?? undefined },
  }
}

function applyFirmLocale(firm: Firm | null) {
  const country = resolveFirmCountry(firm)
  const localeFromFirm = country ? countryToLocale(country) : null
  let locale = 'pt-PT'
  try {
    const storedRaw = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY)
    const stored = storedRaw ? normalizeAppLocale(storedRaw) : null
    if (localeFromFirm) locale = localeFromFirm
    else if (stored) locale = stored
  } catch {
    if (localeFromFirm) locale = localeFromFirm
  }
  if (i18n.language !== locale) {
    i18n.changeLanguage(locale).catch(() => {})
  }
  try {
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale)
  } catch {
    /* ignore */
  }
  try {
    if (document?.documentElement) {
      document.documentElement.lang = locale
    }
  } catch {
    /* ignore */
  }
}

function applyBrandingState(
  firm: Firm | null,
  logoUrl: string | null,
  setters: {
    setFirm: (f: Firm | null) => void
    setFirmLogoUrl: (u: string | null) => void
  },
) {
  setters.setFirm(firm)
  setters.setFirmLogoUrl(logoUrl)
  applyFirmBranding(firm?.branding || null)
  applyFirmLocale(firm)
}

export function FirmBrandingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const tenantSlug = user?.tenant.slug ?? ''
  const [firm, setFirm] = useState<Firm | null>(null)
  const [firmLogoUrl, setFirmLogoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!user?.tenant?.slug) {
        applyFirmBranding(null)
        setFirm(null)
        setFirmLogoUrl(null)
        return
      }

      const cacheKey = user.tenant.slug
      const setters = { setFirm, setFirmLogoUrl }

      const instantFirm = firmFromTenant(user.tenant)
      const instantLogo = user.tenant.logoUrl ?? null
      if (!firm) {
        applyBrandingState(instantFirm, instantLogo, setters)
      }

      if (!opts?.force && firmCache?.cacheKey === cacheKey) {
        applyBrandingState(firmCache.firm, firmCache.logoUrl, setters)
        return
      }

      const cached = !opts?.force ? readFirmBrandingCache(cacheKey) : null
      if (cached) {
        applyBrandingState(cached.firm, cached.logoUrl, setters)
        firmCache = { cacheKey, firm: cached.firm, logoUrl: cached.logoUrl }
        return
      }

      setIsLoading(true)
      try {
        if (isContabilMode()) {
          if (user.role === 'CLIENT') {
            try {
              const hub = (await clientPortalContabilApi.getHub()) as {
                firm?: { slug?: string | null; name: string; logoUrl?: string | null }
              }
              const row = hub.firm
              if (!row?.name) throw new Error('HUB_WITHOUT_FIRM')
              const logo = toPublicAssetUrl(row.logoUrl) || row.logoUrl || null
              const asFirm = firmFromTenant({
                slug: row.slug || user.tenant.slug,
                name: row.name,
                logoUrl: logo,
              })
              applyBrandingState(asFirm, logo, setters)
              firmCache = { cacheKey, firm: asFirm, logoUrl: logo }
              writeFirmBrandingCache(cacheKey, asFirm, logo)
            } catch {
              const asFirm = firmFromTenant(user.tenant)
              applyBrandingState(asFirm, instantLogo, setters)
              firmCache = { cacheKey, firm: asFirm, logoUrl: instantLogo }
              writeFirmBrandingCache(cacheKey, asFirm, instantLogo)
            }
            return
          }

          if (isFirmSessionUser(user)) {
            const res = await contabilFirmApi.getFirm()
            const row = res.firm
            const logo =
              toPublicAssetUrl(res.logoUrl || row.branding?.logoUrl) ||
              res.logoUrl ||
              row.branding?.logoUrl ||
              null
            const asFirm: Firm = {
              id: row.id,
              name: row.name,
              slug: user.tenant.slug,
              country: (row as { countryCode?: string }).countryCode as Firm['country'],
              branding: { logoUrl: logo },
            }
            applyBrandingState(asFirm, logo, setters)
            firmCache = { cacheKey, firm: asFirm, logoUrl: logo }
            writeFirmBrandingCache(cacheKey, asFirm, logo)
            return
          }
        }

        const res = await contabilFirmApi.getMe()
        const firmRow = (res || null) as Firm | null
        if (!firmRow) return
        const logo = toPublicAssetUrl(firmRow.branding?.logoUrl)
        applyBrandingState(firmRow, logo, setters)
        firmCache = { cacheKey, firm: firmRow, logoUrl: logo }
        writeFirmBrandingCache(cacheKey, firmRow, logo)
      } catch {
        const fallback = firmFromTenant(user.tenant)
        applyBrandingState(fallback, instantLogo, setters)
      } finally {
        setIsLoading(false)
      }
    },
    [user?.tenant, user?.role],
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    return onAppDataChanged((detail) => {
      if (!detail.scope || detail.scope === 'firm' || detail.scope === 'branding') {
        void refresh({ force: true })
      }
    })
  }, [refresh])

  const value = useMemo(
    () => ({ firm, firmLogoUrl, isLoading, refresh }),
    [firm, firmLogoUrl, isLoading, refresh],
  )

  return <FirmBrandingContext.Provider value={value}>{children}</FirmBrandingContext.Provider>
}
