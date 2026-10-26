import { useCallback, useEffect, useMemo, useState } from 'react'

import type { CalculatorClientHints } from '@/features/firm/fiscal/CalculatorClientBar'
import { useFirmClientsDirectory } from '@/shared/hooks/queries/useFirmClientsDirectory'

/** Estado partilhado: cliente seleccionado + mapa de nomes para o histórico. */
export function useCalculatorClient(initialClientId?: string) {
  const [clientId, setClientId] = useState(initialClientId || '')
  const [hints, setHints] = useState<CalculatorClientHints | null>(null)
  const clientsQuery = useFirmClientsDirectory({ limit: 500 })

  useEffect(() => {
    if (initialClientId) setClientId(initialClientId)
  }, [initialClientId])

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of clientsQuery.data?.items || []) {
      const id = String(c._id || c.id || '')
      if (!id) continue
      map.set(id, c.displayName || c.fullName || c.name || id)
    }
    return map
  }, [clientsQuery.data])

  const onHints = useCallback((h: CalculatorClientHints | null) => {
    setHints(h)
  }, [])

  return {
    clientId,
    setClientId,
    hints,
    onHints,
    clientNameById,
  }
}
