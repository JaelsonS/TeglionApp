import { useEffect, useRef, useState } from 'react'

import { lookupPostalAddress } from '@/infrastructure/postalLookup'
import { digitsOnly, formatPostalCode, isValidPostalCode } from '@/shared/utils/documents'

export type PostalLookupStatus = 'idle' | 'loading' | 'success' | 'error'

type LookupPatch = {
  postalCode?: string
  street?: string
  city?: string
  region?: string
  neighborhood?: string
  parish?: string
  municipality?: string
  district?: string
}

export function usePostalAddressLookup(
  postalCode: string,
  onResolved: (patch: LookupPatch) => void,
  country: 'PT' | 'BR' = 'PT',
) {
  const [status, setStatus] = useState<PostalLookupStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const lastKeyRef = useRef<string | null>(null)
  const onResolvedRef = useRef(onResolved)
  onResolvedRef.current = onResolved

  useEffect(() => {
    const raw = postalCode.trim()
    if (!raw) {
      setStatus('idle')
      setError(null)
      return
    }

    if (!isValidPostalCode(country, raw)) return

    const lookupKey = `${country}:${digitsOnly(raw) || raw}`
    if (lastKeyRef.current === lookupKey) return

    const timeoutId = window.setTimeout(async () => {
      setStatus('loading')
      setError(null)
      try {
        const addr = await lookupPostalAddress({ country, postalCode: raw })
        lastKeyRef.current = lookupKey
        onResolvedRef.current({
          postalCode: addr.postalCode ? formatPostalCode(country, addr.postalCode) : raw,
          street: addr.street,
          city: addr.city,
          region: addr.region,
          neighborhood: addr.neighborhood,
          parish: addr.parish,
          municipality: addr.municipality,
          district: addr.district,
        })
        setStatus('success')
      } catch {
        setStatus('error')
        setError('Não foi possível localizar o endereço. Preencha manualmente.')
      }
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [country, postalCode])

  return { status, error, isLoading: status === 'loading' }
}
