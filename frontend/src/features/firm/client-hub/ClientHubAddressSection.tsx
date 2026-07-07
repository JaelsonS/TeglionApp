import { useCallback, useEffect, useState } from 'react'

import {
  buildAddressMetadata,
  parseAddressFromFiscal,
  type ClientAddressFormState,
} from '@/features/firm/components/clientAddress'
import { ClientAddressFields } from '@/features/firm/components/ClientAddressFields'
import type { ClientFiscalProfile } from '@/infrastructure/api/contabil/types'
import { useDebouncedCallback } from '@/shared/hooks/useDebouncedCallback'

type Props = {
  address: ClientFiscalProfile['address']
  saving?: boolean
  onSave: (address: ClientFiscalProfile['address']) => void
}

export function ClientHubAddressSection({ address, saving, onSave }: Props) {
  const [draft, setDraft] = useState<ClientAddressFormState>(() => parseAddressFromFiscal(address))

  useEffect(() => {
    setDraft(parseAddressFromFiscal(address))
  }, [address])

  const debouncedSave = useDebouncedCallback((next: ClientAddressFormState) => {
    const meta = buildAddressMetadata(next)
    onSave(meta ?? null)
  }, 700)

  const handleChange = useCallback(
    (next: ClientAddressFormState) => {
      setDraft(next)
      debouncedSave(next)
    },
    [debouncedSave],
  )

  return (
    <div className={saving ? 'opacity-80' : undefined}>
      <p className="mb-3 text-xs text-muted-foreground">
        Comece pelo código postal — os restantes campos preenchem automaticamente quando possível.
      </p>
      <ClientAddressFields value={draft} onChange={handleChange} idPrefix="hub-address" />
    </div>
  )
}
