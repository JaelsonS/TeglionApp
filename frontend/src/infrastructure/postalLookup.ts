import { api } from '@/infrastructure/api'
import { digitsOnly } from '@/shared/utils/documents'

export type PostalLookupResult = {
  street: string
  neighborhood: string
  city: string
  region: string
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

  return {
    street: String(address.street || ''),
    neighborhood: String(address.district || ''),
    city: String(address.city || ''),
    region: String(address.state || ''),
    number: String(address.number || ''),
    country,
    postalCode: String(address.postalCode || digits),
  }
}
