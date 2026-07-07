import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { CONTABIL_LEGAL_VERSIONS } from '@/features/legal/contabil/versions'
import { contabilPublicApi } from '@/infrastructure/api'
import type { CheckedState } from '@radix-ui/react-checkbox'

import { Checkbox } from '@/shared/components/ui/checkbox'
import { Label } from '@/shared/components/ui/label'

export type FirmLegalConsentState = {
  terms: boolean
  privacy: boolean
  dpa: boolean
  cookies: boolean
}

export type FirmLegalConsentPayload = FirmLegalConsentState & {
  versions: {
    terms: string
    privacy: string
    dpa: string
    cookies: string
  }
}

const DEFAULT_STATE: FirmLegalConsentState = {
  terms: false,
  privacy: false,
  dpa: false,
  cookies: false,
}

type Props = {
  value: FirmLegalConsentState
  onChange: (next: FirmLegalConsentState) => void
  disabled?: boolean
  error?: string | null
}

export function isFirmLegalConsentComplete(state: FirmLegalConsentState): boolean {
  return state.terms && state.privacy && state.dpa && state.cookies
}

export function buildFirmLegalConsentPayload(state: FirmLegalConsentState): FirmLegalConsentPayload {
  const { terms, privacy, dpa, cookies } = CONTABIL_LEGAL_VERSIONS
  return {
    ...state,
    versions: { terms, privacy, dpa, cookies },
  }
}

export function LegalConsentBlock({ value, onChange, disabled, error }: Props) {
  const [versionError, setVersionError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    contabilPublicApi
      .getLegalVersions()
      .then((res) => {
        if (cancelled) return
        const remote = res?.versions
        if (!remote) return
        const keys = ['terms', 'privacy', 'dpa', 'cookies'] as const
        const mismatch = keys.some((k) => remote[k] !== CONTABIL_LEGAL_VERSIONS[k])
        if (mismatch) {
          setVersionError('Documentos legais actualizados. Recarregue a página antes de continuar.')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVersionError('Não foi possível verificar os documentos legais. Tente recarregar a página.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const set = (key: keyof FirmLegalConsentState, checked: boolean) => {
    onChange({ ...value, [key]: checked })
  }

  const items: { key: keyof FirmLegalConsentState; href: string; label: string }[] = [
    { key: 'terms', href: '/termos', label: 'Termos de Utilização' },
    { key: 'privacy', href: '/privacidade', label: 'Política de Privacidade' },
    { key: 'dpa', href: '/dpa', label: 'Acordo de Tratamento de Dados (DPA)' },
    { key: 'cookies', href: '/cookies', label: 'Política de Cookies' },
  ]

  return (
    <fieldset className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4" disabled={disabled}>
      <legend className="text-sm font-semibold text-slate-800">Documentos legais obrigatórios</legend>
      <p className="text-xs text-slate-600">
        Como responsável pelo tratamento dos dados dos seus clientes na Plataforma, deve aceitar todos os documentos
        abaixo para criar a conta do escritório (versão {CONTABIL_LEGAL_VERSIONS.terms}).
      </p>
      {items.map((item) => (
        <div key={item.key} className="flex items-start gap-3">
          <Checkbox
            id={`legal-${item.key}`}
            checked={value[item.key]}
            onCheckedChange={(c: CheckedState) => set(item.key, c === true)}
            disabled={disabled}
          />
          <Label htmlFor={`legal-${item.key}`} className="cursor-pointer text-sm leading-snug text-slate-700">
            Aceito os{' '}
            <Link to={item.href} target="_blank" rel="noopener noreferrer" className="font-medium text-[#0f2942] underline">
              {item.label}
            </Link>
          </Label>
        </div>
      ))}
      {(error || versionError) && (
        <p className="text-xs text-red-600" role="alert">
          {versionError || error}
        </p>
      )}
    </fieldset>
  )
}

export { DEFAULT_STATE as emptyFirmLegalConsent }
