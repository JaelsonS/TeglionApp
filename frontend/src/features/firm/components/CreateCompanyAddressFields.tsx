import { useCallback, useRef } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

import {
  applyPostalLookupToAddress,
  type ClientAddressFormState,
} from '@/features/firm/components/clientAddress'
import { usePostalAddressLookup } from '@/shared/hooks/usePostalAddressLookup'
import { formatPostalCode } from '@/shared/utils/documents'
import { cn } from '@/shared/lib/utils'

type FieldProps = {
  id: string
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}

export function WizardField({ id, label, required, hint, children }: FieldProps) {
  return (
    <div className="cb-company-field">
      <label htmlFor={id} className="cb-company-label">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="cb-company-hint">{hint}</p> : null}
    </div>
  )
}

export function CreateCompanyAddressFields({
  value,
  onChange,
  idPrefix = 'co',
}: {
  value: ClientAddressFormState
  onChange: (next: ClientAddressFormState) => void
  idPrefix?: string
}) {
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
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <WizardField
          id={`${idPrefix}-postal`}
          label="Código postal"
          required
          hint="Introduza o código postal — localidade e freguesia são sugeridas automaticamente."
        >
          <div className="relative">
            <input
              id={`${idPrefix}-postal`}
              className="cb-company-input pr-9"
              value={value.postalCode}
              onChange={(e) => set('postalCode', formatPostalCode('PT', e.target.value))}
              placeholder="0000-000"
              autoComplete="postal-code"
            />
            {isLoading ? (
              <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : status === 'success' ? (
              <CheckCircle2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
            ) : null}
          </div>
          {status === 'error' && error ? <p className="cb-company-hint text-amber-700">{error}</p> : null}
        </WizardField>

        <WizardField id={`${idPrefix}-locality`} label="Localidade" required hint="Localidade / concelho.">
          <input
            id={`${idPrefix}-locality`}
            className="cb-company-input"
            value={value.municipality}
            onChange={(e) => set('municipality', e.target.value)}
            placeholder="Ex.: Porto"
            autoComplete="address-level2"
          />
        </WizardField>
      </div>

      <WizardField id={`${idPrefix}-parish`} label="Freguesia" hint="Preenchida automaticamente com o código postal; pode editar.">
        <input
          id={`${idPrefix}-parish`}
          className="cb-company-input"
          value={value.parish}
          onChange={(e) => set('parish', e.target.value)}
          placeholder="Ex.: Cedofeita"
          autoComplete="address-level3"
        />
      </WizardField>

      <WizardField id={`${idPrefix}-street`} label="Morada" required hint="Morada da sede / residência.">
        <input
          id={`${idPrefix}-street`}
          className="cb-company-input"
          value={value.street}
          onChange={(e) => set('street', e.target.value)}
          placeholder="Ex.: Avenida da República, 123"
          autoComplete="street-address"
        />
      </WizardField>

      <div className="hidden">
        <input value={value.district} readOnly tabIndex={-1} aria-hidden />
      </div>
    </div>
  )
}

export function WizardInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('cb-company-input', className)} {...props} />
}

export function WizardSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('cb-company-input', className)} {...props}>
      {children}
    </select>
  )
}
