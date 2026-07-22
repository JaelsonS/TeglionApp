import { api } from '@/infrastructure/api'
import { digitsOnly } from '@/shared/utils/documents'

export type PostalLookupResult = {
  street: string
  /** BR: bairro. Prefer `parish` for PT freguesia. */
  neighborhood: string
  city: string
  region: string
  /** PT: freguesia. BR: bairro. */
  parish: string
  /** PT: concelho / localidade. BR: cidade. */
  municipality: string
  /** PT: distrito. BR: UF (via state). */
  district: string
  number?: string
  country: 'BR' | 'PT'
  postalCode: string
}

export async function lookupPostalAddress(params: { country: 'BR' | 'PT'; postalCode: string }): Promise<PostalLookupResult> {
  const country = params.country
  const rawPostal = String(params.postalCode || '').trim()
  const digits = digitsOnly(rawPostal)

  const { data } = await api.get('/public/postal-lookup', {
    params: { country, postalCode: rawPostal },
  })

  const address = data?.address || {}
  const parish = String(address.parish || '')
  const municipality = String(address.municipality || address.city || '')
  const district =
    country === 'PT'
      ? String(address.district || '')
      : String(address.state || address.district || '')
  const neighborhood = country === 'PT' ? parish : String(address.district || parish || '')
  const region = country === 'PT' ? district || String(address.state || '') : String(address.state || '')

  return {
    street: String(address.street || ''),
    neighborhood,
    city: municipality || String(address.city || ''),
    region,
    parish,
    municipality,
    district,
    number: String(address.number || ''),
    country,
    postalCode: String(address.postalCode || digits),
  }
}
