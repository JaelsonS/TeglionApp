import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { AuthCard } from '@/shared/components/auth/AuthCard'
import { AuthFooter } from '@/shared/components/auth/AuthFooter'
import { AuthHeader } from '@/shared/components/auth/AuthHeader'
import { AuthLayout } from '@/shared/components/auth/AuthLayout'
import { contabilPt as t } from '@/shared/i18n/contabilPt'
import { authFirmLoginUrl, authFirmRegisterUrl, authProfileChoiceUrl } from '@/shared/constants/authPaths'
import { contabilFirmApi } from '@/infrastructure/api'
import { useAuth } from '@/shared/hooks/useAuth'
import { getErrorMessage } from '@/shared/utils/errors'
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

export function FirmRegisterGooglePage() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<PendingGoogle | null>(null)
  const [legal, setLegal] = useState<FirmLegalConsentState>(emptyFirmLegalConsent)
  const [legalError, setLegalError] = useState<string | null>(null)
  const [countryCode, setCountryCode] = useState<CountryCode>('PT')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firmName: '', ownerName: '' },
  })

  useEffect(() => {
    let cancelled = false
    void api
      .get<{ email: string; ownerName: string; countryCode?: CountryCode }>('/auth/google/pending')
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
      .catch(() => {
        if (!cancelled) setPending(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [form])

  const onSubmit = form.handleSubmit(async (values) => {
    if (!pending) return
    if (!isFirmLegalConsentComplete(legal)) {
      setLegalError('Deve aceitar todos os documentos legais para criar a conta.')
      return
    }
    setLegalError(null)
    setSubmitting(true)
    try {
      const res = await contabilFirmApi.registerWithGoogle({
        firmName: values.firmName.trim(),
        ownerName: values.ownerName.trim(),
        countryCode,
        legalConsents: buildFirmLegalConsentPayload(legal),
      })
      if (!setSession(res.user)) {
        toast.warning('Conta criada. Inicie sessão com Google novamente.')
        navigate(authFirmLoginUrl(), { replace: true })
        return
      }
      toast.success('Escritório criado com Google')
      navigate('/app/firm/dashboard', { replace: true })
    } catch (err) {
      let title = 'Não foi possível concluir o registo'
      if (isAxiosError(err)) {
        const status = err.response?.status
        const code = String((err.response?.data as { code?: string })?.code || '').toUpperCase()
        if (status === 409) title = 'Este e-mail Google já está registado'
        if (code === 'SSO_PENDING_NOT_FOUND') title = 'Sessão Google expirada — tente de novo'
        if (code === 'LEGAL_CONSENT_INCOMPLETE') title = 'Aceite todos os documentos legais'
      }
      toast.error(title, { description: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  })

  if (loading) {
    return (
      <AuthLayout
        title="A preparar registo..."
        subtitle="A validar a sua conta Google."
      >
        <div className="mx-auto max-w-md">
          <AuthCard>
            <AuthHeader
              title="A preparar registo..."
              subtitle="A validar a sua conta Google."
            />
            <div className="mt-8 h-24 animate-pulse rounded-xl bg-slate-100" />
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
        <div className="mx-auto max-w-md">
          <AuthCard>
            <AuthHeader
              title="Sessão Google expirada"
              subtitle="Volte a iniciar o registo com Google ou use e-mail e palavra-passe."
            />
            <div className="mt-8">
              <GoogleAuthButton
                href={getGoogleAuthStartUrl({ intent: 'register', countryCode })}
                label="Continuar com Google"
              />
            </div>
          </AuthCard>

          <AuthFooter className="mt-6">
            <Link to={authFirmRegisterUrl()} className="font-semibold text-slate-900 hover:underline">
              Voltar ao registo
            </Link>
          </AuthFooter>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Concluir escritório"
      subtitle={`Conta Google: ${pending.email}`}
    >
      <div className="mx-auto max-w-md">
        <AuthCard>
          <AuthHeader
            title="Concluir escritório"
            subtitle={`Conta Google: ${pending.email}`}
          />

          <form className="mt-8 space-y-4" onSubmit={(e) => void onSubmit(e)}>
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
            <button
              type="submit"
              className="cb-btn-primary mt-2 w-full disabled:opacity-60"
              disabled={submitting || !isFirmLegalConsentComplete(legal)}
            >
              {submitting ? 'A criar escritório...' : 'Criar escritório com Google'}
            </button>
          </form>
        </AuthCard>

        <AuthFooter className="mt-6">
          <Link to={authFirmRegisterUrl()} className="font-semibold text-slate-900 hover:underline">
            Registar com e-mail
          </Link>
          <span className="mx-2">·</span>
          <Link to={authFirmLoginUrl()} className="hover:underline">
            {t.auth.loginLink}
          </Link>
          <span className="mx-2">·</span>
          <Link to={authProfileChoiceUrl('register')} className="hover:underline">
            Voltar à escolha de perfil
          </Link>
        </AuthFooter>
      </div>
    </AuthLayout>
  )
}
