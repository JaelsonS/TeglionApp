import { useCallback, useRef } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Loader2 } from 'lucide-react'

import {
  applyPostalLookupToAddress,
  type ClientAddressFormState,
} from '@/features/firm/components/clientAddress'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { usePostalAddressLookup } from '@/shared/hooks/usePostalAddressLookup'
import { formatPostalCode } from '@/shared/utils/documents'
import { cn } from '@/shared/lib/utils'

type Props = {
  value: ClientAddressFormState
  onChange: (next: ClientAddressFormState) => void
  idPrefix?: string
  className?: string
}

function Field({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

export function ClientAddressFields({ value, onChange, idPrefix = 'addr', className }: Props) {
  const valueRef = useRef(value)
  valueRef.current = value

  const onResolved = useCallback(
    (patch: Parameters<typeof applyPostalLookupToAddress>[1]) => {
      onChange(applyPostalLookupToAddress(valueRef.current, patch))
    },
    [onChange],
  )

  const { status, error, isLoading } = usePostalAddressLookup(value.postalCode, onResolved, 'PT')

  const set = (key: keyof ClientAddressFormState, v: string) => {
    onChange({ ...value, [key]: v })
  }

  return (
    <div className={cn('space-y-3', className)}>
      <Field id={`${idPrefix}-postal`} label="Código postal">
        <div className="relative">
          <Input
            id={`${idPrefix}-postal`}
            value={value.postalCode}
            onChange={(e: FormChangeEvent) => set('postalCode', formatPostalCode('PT', e.target.value))}
            placeholder="0000-000"
            autoComplete="postal-code"
          />
          {isLoading ? (
            <Loader2
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-label="A pesquisar morada"
            />
          ) : null}
        </div>
        {status === 'error' && error ? (
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        ) : null}
        {status === 'success' ? (
          <p className="mt-1 text-xs text-emerald-700">Morada sugerida — pode editar os campos abaixo.</p>
        ) : null}
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field id={`${idPrefix}-district`} label="Distrito">
          <Input
            id={`${idPrefix}-district`}
            value={value.district}
            onChange={(e: FormChangeEvent) => set('district', e.target.value)}
            placeholder="Ex.: Lisboa"
            autoComplete="address-level1"
          />
        </Field>
        <Field id={`${idPrefix}-municipality`} label="Concelho">
          <Input
            id={`${idPrefix}-municipality`}
            value={value.municipality}
            onChange={(e: FormChangeEvent) => set('municipality', e.target.value)}
            placeholder="Ex.: Lisboa"
            autoComplete="address-level2"
          />
        </Field>
      </div>

      <Field id={`${idPrefix}-parish`} label="Freguesia">
        <Input
          id={`${idPrefix}-parish`}
          value={value.parish}
          onChange={(e: FormChangeEvent) => set('parish', e.target.value)}
          placeholder="Ex.: Santa Maria Maior"
          autoComplete="address-level3"
        />
      </Field>

      <Field id={`${idPrefix}-street`} label="Rua / Morada">
        <Input
          id={`${idPrefix}-street`}
          value={value.street}
          onChange={(e: FormChangeEvent) => set('street', e.target.value)}
          placeholder="Ex.: Rua Augusta, 10"
          autoComplete="street-address"
        />
      </Field>
    </div>
  )
}
