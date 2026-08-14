import { useEffect, useId, useState } from 'react'

import { CONTABIL_LEGAL_VERSIONS } from '@/features/legal/contabil/versions'
import { contabilPublicApi } from '@/infrastructure/api'
import type { CheckedState } from '@radix-ui/react-checkbox'

import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { cn } from '@/shared/lib/utils'

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

/** Regras actuais (inalteradas): os 4 documentos são obrigatórios no registo. */
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

type LegalDocKey = keyof FirmLegalConsentState

type LegalDocItem = {
  key: LegalDocKey
  href: string
  /** Texto curto junto ao checkbox (aceite). */
  acceptLabel: string
  /** Título no modal. */
  title: string
  /** 1–2 linhas — o que é o documento, sem conclusões jurídicas novas. */
  summary: string
}

const LEGAL_ITEMS: LegalDocItem[] = [
  {
    key: 'terms',
    href: '/termos',
    acceptLabel: 'Aceito os Termos de Utilização',
    title: 'Termos de Utilização',
    summary:
      'Define as condições de utilização do Teglion, os direitos e responsabilidades das partes e as regras aplicáveis à utilização da plataforma.',
  },
  {
    key: 'privacy',
    href: '/privacidade',
    acceptLabel: 'Confirmo que li a Política de Privacidade',
    title: 'Política de Privacidade',
    summary:
      'Explica como os dados pessoais são tratados no âmbito da plataforma Teglion e quais informações estão disponíveis sobre esse tratamento.',
  },
  {
    key: 'dpa',
    href: '/dpa',
    acceptLabel: 'Aceito o Acordo de Tratamento de Dados (DPA)',
    title: 'Acordo de Tratamento de Dados (DPA)',
    summary:
      'Documento que regula o tratamento de dados no contexto da utilização da plataforma, quando aplicável à relação contratual.',
  },
  {
    key: 'cookies',
    href: '/cookies',
    acceptLabel: 'Aceito a Política de Cookies',
    title: 'Política de Cookies',
    summary:
      'Descreve a utilização de cookies e tecnologias semelhantes no site e na plataforma Teglion.',
  },
]

/**
 * Bloco compacto de aceite legal no registo de escritório.
 * UX apenas — não altera payload, versões nem obrigatoriedade dos 4 checkboxes.
 */
export function LegalConsentBlock({ value, onChange, disabled, error }: Props) {
  const legendId = useId()
  const [versionError, setVersionError] = useState<string | null>(null)
  const [activeDoc, setActiveDoc] = useState<LegalDocItem | null>(null)

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

  const set = (key: LegalDocKey, checked: boolean) => {
    onChange({ ...value, [key]: checked })
  }

  return (
    <>
      <fieldset
        className="rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4"
        disabled={disabled}
        aria-labelledby={legendId}
        data-testid="firm-legal-consent"
      >
        <legend id={legendId} className="px-0.5 text-sm font-semibold text-slate-900">
          Termos e privacidade
        </legend>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Consulte os documentos aplicáveis à utilização do Teglion antes de criar a conta.
        </p>

        <ul className="mt-3 space-y-2">
          {LEGAL_ITEMS.map((item) => {
            const checked = value[item.key]
            return (
              <li
                key={item.key}
                className={cn(
                  'flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors',
                  checked ? 'bg-slate-50' : 'bg-transparent',
                )}
              >
                <Checkbox
                  id={`legal-${item.key}`}
                  checked={checked}
                  onCheckedChange={(c: CheckedState) => set(item.key, c === true)}
                  disabled={disabled}
                  className="mt-0.5"
                  aria-describedby={`legal-${item.key}-label`}
                />
                <div className="min-w-0 flex-1">
                  <Label
                    id={`legal-${item.key}-label`}
                    htmlFor={`legal-${item.key}`}
                    className="cursor-pointer text-sm font-medium leading-snug text-slate-800"
                  >
                    {item.acceptLabel}
                  </Label>
                  <button
                    type="button"
                    className="mt-0.5 text-xs font-semibold text-[#0f2942] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2942]/30 rounded-sm"
                    onClick={() => setActiveDoc(item)}
                    disabled={disabled}
                  >
                    Ler
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

        {(error || versionError) && (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {versionError || error}
          </p>
        )}
      </fieldset>

      <Dialog open={Boolean(activeDoc)} onOpenChange={(open: boolean) => !open && setActiveDoc(null)}>
        <DialogContent className="max-w-md rounded-2xl border-slate-200 p-0 sm:max-w-md">
          {activeDoc ? (
            <>
              <DialogHeader className="space-y-2 px-5 pt-5 text-left sm:px-6 sm:pt-6">
                <DialogTitle className="text-lg text-slate-900">{activeDoc.title}</DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-slate-600">
                  {activeDoc.summary}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-col sm:space-x-0 sm:px-6">
                <a
                  href={activeDoc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#0f2942] text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2942]/40"
                >
                  Ler documento completo
                </a>
                <button
                  type="button"
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                  onClick={() => setActiveDoc(null)}
                >
                  Fechar
                </button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

export { DEFAULT_STATE as emptyFirmLegalConsent }
