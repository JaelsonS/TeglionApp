/**
 * firm.ts — tenant Teglion (escritório de contabilidade).
 */

export type FirmCountry = 'BR' | 'PT' | 'ES' | 'US'

export type FirmStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'PAST_DUE' | 'CANCELED'

export type FirmBranding = {
  primaryColor?: string | null
  secondaryColor?: string | null
  logoUrl?: string | null
}

export type FirmAddress = {
  country?: FirmCountry | string | null
  [key: string]: unknown
}

export type Firm = {
  id?: string
  _id?: string
  name?: string
  country?: FirmCountry | null
  businessType?: string | null
  status?: FirmStatus | null
  branding?: FirmBranding | null
  address?: FirmAddress | null
  publicProfile?: {
    address?: FirmAddress | null
    [key: string]: unknown
  } | null
  consents?: {
    audit?: {
      country?: FirmCountry | string | null
      locale?: string | null
    } | null
    [key: string]: unknown
  } | null
  billing?: {
    trialEndsAt?: string | null
    [key: string]: unknown
  } | null
  landingAllowedOrigins?: string[] | null
  settings?: Record<string, unknown> | null
  [key: string]: unknown
}
