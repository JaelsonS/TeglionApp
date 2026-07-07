import type { Firm } from '@/shared/types/firm'
import type { AppLocale } from '@/shared/i18n/appLocale'

export type FirmCountry = 'BR' | 'PT' | 'ES' | 'US' | null

const PHONE_SEPARATOR = String.fromCharCode(32)

const PHONE_PLACEHOLDERS: Record<'BR' | 'PT' | 'ES' | 'US', string> = {
  BR: ['+55', '11', '99999-9999'].join(PHONE_SEPARATOR),
  PT: ['+351', '912', '345', '678'].join(PHONE_SEPARATOR),
  ES: ['+34', '600', '123', '456'].join(PHONE_SEPARATOR),
  US: ['+1', '202', '555', '0101'].join(PHONE_SEPARATOR),
}

export function resolveFirmCountry(firm: Firm | null | undefined): FirmCountry {
  const raw =
    firm?.country ||
    firm?.address?.country ||
    firm?.publicProfile?.address?.country ||
    firm?.consents?.audit?.country ||
    null

  const normalized = String(raw || '').trim().toUpperCase()
  if (normalized === 'BR' || normalized === 'PT' || normalized === 'ES' || normalized === 'US') {
    return normalized as FirmCountry
  }
  return null
}

export function countryToLocale(country: FirmCountry): AppLocale {
  if (country === 'BR') return 'pt-BR'
  return 'pt-PT'
}

export function countryToPhoneCountry(country: FirmCountry): 'BR' | 'PT' | 'ES' | 'US' {
  if (country === 'PT') return 'PT'
  if (country === 'ES') return 'ES'
  if (country === 'US') return 'US'
  return 'BR'
}

export function phonePlaceholder(country: 'BR' | 'PT' | 'ES' | 'US') {
  return PHONE_PLACEHOLDERS[country] ?? PHONE_PLACEHOLDERS.BR
}
