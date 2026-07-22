import type { ClientFiscalProfile } from '@/infrastructure/api/contabil/types'
export type ClientAddressFormState = {
  postalCode: string
  street: string
  municipality: string
  district: string
  parish: string
}

export const emptyClientAddressForm = (): ClientAddressFormState => ({
  postalCode: '',
  street: '',
  municipality: '',
  district: '',
  parish: '',
})

export function parseAddressFromFiscal(
  address: ClientFiscalProfile['address'],
): ClientAddressFormState {
  if (!address) return emptyClientAddressForm()
  if (typeof address === 'string') {
    return { ...emptyClientAddressForm(), street: address }
  }
  return {
    postalCode: address.postalCode || '',
    street: address.street || address.formatted || '',
    municipality: address.municipality || '',
    district: address.district || '',
    parish: address.parish || '',
  }
}

export function buildAddressMetadata(
  address: ClientAddressFormState,
): ClientFiscalProfile['address'] | undefined {
  const parts = {
    postalCode: address.postalCode.trim() || null,
    street: address.street.trim() || null,
    municipality: address.municipality.trim() || null,
    district: address.district.trim() || null,
    parish: address.parish.trim() || null,
  }
  const hasValue = Object.values(parts).some(Boolean)
  if (!hasValue) return undefined
  return parts
}

export function applyPostalLookupToAddress(
  current: ClientAddressFormState,
  lookup: {
    postalCode?: string
    street?: string
    city?: string
    region?: string
    neighborhood?: string
    parish?: string
    municipality?: string
    district?: string
  },
): ClientAddressFormState {
  return {
    postalCode: lookup.postalCode || current.postalCode,
    street: lookup.street || current.street,
    municipality: lookup.municipality || lookup.city || current.municipality,
    district: lookup.district || lookup.region || current.district,
    parish: lookup.parish || lookup.neighborhood || current.parish,
  }
}
