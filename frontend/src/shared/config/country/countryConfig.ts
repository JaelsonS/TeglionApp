export type CountryCode = 'PT' | 'BR'

export type CountryConfig = {
  code: CountryCode
  name: string
  locale: string
  currency: string
  taxIdLabel: string
  features: {
    fiscalCalendar: boolean
    postalLookup: boolean
    clientPortal: boolean
  }
}

export const PT_COUNTRY: CountryConfig = {
  code: 'PT',
  name: 'Portugal',
  locale: 'pt-PT',
  currency: 'EUR',
  taxIdLabel: 'NIF',
  features: { fiscalCalendar: true, postalLookup: true, clientPortal: true },
}

export const BR_COUNTRY: CountryConfig = {
  code: 'BR',
  name: 'Brasil',
  locale: 'pt-BR',
  currency: 'BRL',
  taxIdLabel: 'CNPJ',
  features: { fiscalCalendar: false, postalLookup: false, clientPortal: true },
}

const REGISTRY: Record<CountryCode, CountryConfig> = {
  PT: PT_COUNTRY,
  BR: BR_COUNTRY,
}

export const SUPPORTED_COUNTRIES: CountryConfig[] = [PT_COUNTRY, BR_COUNTRY]

export function resolveCountryConfig(countryCode?: string | null): CountryConfig {
  const code = String(countryCode || 'PT').trim().toUpperCase() as CountryCode
  return REGISTRY[code] ?? PT_COUNTRY
}
