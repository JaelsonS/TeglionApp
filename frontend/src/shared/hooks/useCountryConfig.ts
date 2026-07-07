import { useContext, useMemo } from 'react'

import { FirmBrandingContext } from '@/shared/contexts/FirmBrandingContext'
import { resolveCountryConfig, type CountryConfig } from '@/shared/config/country/countryConfig'
import { resolveFirmCountry } from '@/shared/utils/firmLocale'

export function useCountryConfig(): CountryConfig {
  const branding = useContext(FirmBrandingContext)
  return useMemo(() => {
    const fromFirm = resolveFirmCountry(branding?.firm ?? null)
    return resolveCountryConfig(fromFirm || 'PT')
  }, [branding?.firm])
}
