import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { AuthAgencyIdentity } from '@/shared/components/auth/AuthAgencyIdentity'
import { AuthCard } from '@/shared/components/auth/AuthCard'
import { AuthFooter } from '@/shared/components/auth/AuthFooter'
import { AuthLayout } from '@/shared/components/auth/AuthLayout'
import { TurnstileField, type TurnstileFieldHandle } from '@/shared/components/security/TurnstileField'
import { contabilPt as t } from '@/shared/i18n/contabilPt'
import { authFirmLoginUrl, authFirmRegisterUrl, authProfileChoiceUrl } from '@/shared/constants/authPaths'
import { contabilFirmApi } from '@/infrastructure/api'
import { useAuth } from '@/shared/hooks/useAuth'
import { getErrorMessage } from '@/shared/utils/errors'
import { withTurnstileToken } from '@/shared/security/withTurnstileToken'
import { isTurnstileEnabled, TURNSTILE_ACTIONS } from '@/shared/security/turnstile'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  LegalConsentBlock,
  buildFirmLegalConsentPayload,
  emptyFirmLegalConsent,
  isFirmLegalConsentComplete,
  type FirmLegalConsentState,
} from '@/shared/components/legal/LegalConsentBlock'
import { SUPPORTED_COUNTRIES, type CountryCode } from '@/shared/config/country/countryConfig'
import { api } from '@/infrastructure/http/apiClient'
import { getGoogleAuthStartUrl } from '@/infrastructure/api'
import { GoogleAuthButton } from '@/shared/components/auth/GoogleAuthButton'
import { Sentry } from '@/shared/lib/sentry'
import {
  clearStoredOAuthPendingToken,
  oauthPendingHeaders,
  readStoredOAuthPendingToken,
} from '@/features/auth/firm/oauthPendingToken'

const schema = z.object({
  firmName: z.string().min(2, 'Nome do escritório obrigatório'),
  ownerName: z.string().min(2, 'Nome obrigatório'),
})

type FormValues = z.infer<typeof schema>

type PendingGoogle = {
  email: string
  ownerName: string
  countryCode: CountryCode
}

function reportPendingMissing(reason: string, err?: unknown) {
  if (!Sentry) return
  try {
    Sentry.withScope((scope) => {
      scope.setLevel('error')
      scope.setTag('auth.flow', 'google_sso')
      scope.setTag('auth.code', 'SSO_PENDING_NOT_FOUND')
      scope.setContext('google_register', {
        reason,
        path: typeof window !== 'undefined' ? window.location.pathname : '',
        hasStoredToken: Boolean(readStoredOAuthPendingToken()),
      })
      if (err instanceof Error) {
        Sentry.captureException(err)
      } else {
        Sentry.captureMessage(`Google firm register: sessão pendente em falta (${reason})`)
      }
    })
  } catch {
    /* ignore */
  }
}

export function FirmRegisterGooglePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setSession } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<PendingGoogle | null>(null)
  const [pendingToken, setPendingToken] = useState<string | null>(null)
  const [legal, setLegal] = useState<FirmLegalConsentState>(emptyFirmLegalConsent)
  const [legalError, setLegalError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileFieldHandle | null>(null)
  const [countryCode, setCountryCode] = useState<CountryCode>('PT')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firmName: '', ownerName: '' },
  })

  useEffect(() => {
    let cancelled = false
    const fromQuery = searchParams.get('pending')
    const token = readStoredOAuthPendingToken()
    if (fromQuery) {
      setPendingToken(fromQuery.trim())
      const next = new URLSearchParams(searchParams)
      next.delete('pending')
      setSearchParams(next, { replace: true })
    } else if (token) {
      setPendingToken(token)
    }

    void api
      .get<{ email: string; ownerName: string; countryCode?: CountryCode }>('/auth/google/pending', {
        headers: oauthPendingHeaders(token || fromQuery),
      })
      .then((res) => {
        if (cancelled) return
        const data = res.data
        setPending({
          email: data.email,
          ownerName: data.ownerName,
          countryCode: (data.countryCode as CountryCode) || 'PT',
        })
        setCountryCode((data.countryCode as CountryCode) || 'PT')
        form.reset({
          firmName: '',
          ownerName: data.ownerName || '',
        })
      })
      .catch((err) => {
        if (cancelled) return
        setPending(null)
        clearStoredOAuthPendingToken()
        reportPendingMissing('pending_fetch_failed', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // Carregar uma vez ao montar (token na URL / sessionStorage).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = form.handleSubmit(async (values) => {
    if (!pending) return
    if (!isFirmLegalConsentComplete(legal)) {
      setLegalError('Deve aceitar todos os documentos legais para criar a conta.')
      return
    }
    setLegalError(null)
    setSubmitting(true)
    try {
      const token = pendingToken || readStoredOAuthPendingToken()
      const res = await contabilFirmApi.registerWithGoogle(
        withTurnstileToken(
          {
            firmName: values.firmName.trim(),
            ownerName: values.ownerName.trim(),
            countryCode,
            legalConsents: buildFirmLegalConsentPayload(legal),
            ...(token ? { pendingToken: token } : {}),
          },
          turnstileToken,
        ),
      )
      clearStoredOAuthPendingToken()
      if (!setSession(res.user)) {
        toast.warning('Conta criada. Inicie sessão com Google novamente.')
        navigate(authFirmLoginUrl(), { replace: true })
        return
      }
      toast.success('Escritório criado — bem-vindo!', {
        description: 'Enviámos um e-mail de boas-vindas. Pode entrar sempre com Google.',
      })
      navigate('/app/firm/dashboard', { replace: true })
    } catch (err) {
      turnstileRef.current?.reset()
      setTurnstileToken('')
      let title = 'Não foi possível concluir o registo'
      if (err instanceof Error && /verificação de segurança/i.test(err.message)) {
        toast.error(err.message)
        return
      }
      if (isAxiosError(err)) {
        const status = err.response?.status
        const code = String((err.response?.data as { code?: string })?.code || '').toUpperCase()
        if (status === 409) title = 'Este e-mail Google já está registado'
        if (code === 'SSO_PENDING_NOT_FOUND') {
          title = 'Sessão Google expirada — tente de novo'
          clearStoredOAuthPendingToken()
          reportPendingMissing('register_submit_pending_missing', err)
        }
        if (code === 'LEGAL_CONSENT_INCOMPLETE') title = 'Aceite todos os documentos legais'
        if (code.startsWith('TURNSTILE_')) title = 'Verificação de segurança falhou. Actualize a página e tente de novo.'
      }
      toast.error(title, { description: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  })

  if (loading) {
    return (
      <AuthLayout title="A preparar registo..." subtitle="A validar a sua conta Google.">
        <div className="w-full">
          <AuthCard className="p-6 sm:p-7">
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          </AuthCard>
        </div>
      </AuthLayout>
    )
  }

  if (!pending) {
    return (
      <AuthLayout
        title="Sessão Google expirada"
        subtitle="Volte a iniciar o registo com Google ou use e-mail e palavra-passe."
      >
        <div className="w-full">
          <AuthCard className="p-6 sm:p-7">
            <GoogleAuthButton
              href={getGoogleAuthStartUrl({ intent: 'register', countryCode })}
              label="Continuar com Google"
            />
          </AuthCard>

          <AuthFooter className="mt-6">
            <AuthAgencyIdentity />
            <Link
              to={authFirmRegisterUrl()}
              className="mt-3 block font-semibold text-slate-900 hover:underline"
            >
              Voltar ao registo
            </Link>
          </AuthFooter>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Concluir escritório" subtitle={`Conta Google: ${pending.email}`}>
      <div className="w-full">
        <AuthCard className="p-6 sm:p-7">
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <div>
              <Label htmlFor="countryCode">País do escritório</Label>
              <select
                id="countryCode"
                className="mt-1.5 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value as CountryCode)}
                disabled={submitting}
              >
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="firmName">{t.auth.firmName}</Label>
              <Input id="firmName" className="mt-1.5 rounded-lg border-slate-200" {...form.register('firmName')} />
              {form.formState.errors.firmName ? (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.firmName.message}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="ownerName">{t.auth.ownerName}</Label>
              <Input id="ownerName" className="mt-1.5 rounded-lg border-slate-200" {...form.register('ownerName')} />
              {form.formState.errors.ownerName ? (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.ownerName.message}</p>
              ) : null}
            </div>
            <LegalConsentBlock
              value={legal}
              onChange={(next) => {
                setLegal(next)
                if (isFirmLegalConsentComplete(next)) setLegalError(null)
              }}
              disabled={submitting}
              error={legalError}
            />
            <TurnstileField
              action={TURNSTILE_ACTIONS.REGISTER_FIRM_GOOGLE}
              onTokenChange={setTurnstileToken}
              fieldRef={turnstileRef}
            />
            <button
              type="submit"
              className="cb-btn-primary mt-2 w-full disabled:opacity-60"
              disabled={
                submitting ||
                !isFirmLegalConsentComplete(legal) ||
                (isTurnstileEnabled() && !turnstileToken)
              }
            >
              {submitting ? 'A criar escritório...' : 'Criar escritório com Google'}
            </button>
          </form>
        </AuthCard>

        <AuthFooter className="mt-6">
          <AuthAgencyIdentity />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
            <Link to={authFirmRegisterUrl()} className="font-semibold text-slate-900 hover:underline">
              Registar com e-mail
            </Link>
            <span aria-hidden>·</span>
            <Link to={authFirmLoginUrl()} className="hover:underline">
              {t.auth.loginLink}
            </Link>
            <span aria-hidden>·</span>
            <Link to={authProfileChoiceUrl('register')} className="hover:underline">
              Voltar à escolha de perfil
            </Link>
          </div>
        </AuthFooter>
      </div>
    </AuthLayout>
  )
}
