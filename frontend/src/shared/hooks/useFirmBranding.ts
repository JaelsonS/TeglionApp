import { useContext } from 'react'

import { FirmBrandingContext } from '@/shared/contexts/FirmBrandingContext'

const ERROR = 'useFirmBranding deve ser usado dentro de <FirmBrandingProvider />'

export function useFirmBranding() {
  const ctx = useContext(FirmBrandingContext)
  if (!ctx) throw new Error(ERROR)
  return ctx
}
