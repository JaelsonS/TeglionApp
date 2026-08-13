import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { CheckedState } from '@radix-ui/react-checkbox'
import { isAxiosError } from 'axios'

import { AuthCard } from '@/shared/components/auth/AuthCard'
import { AuthFooter } from '@/shared/components/auth/AuthFooter'
import { AuthHeader } from '@/shared/components/auth/AuthHeader'
import { AuthLayout } from '@/shared/components/auth/AuthLayout'
import { OfficeScreensCarousel } from '@/shared/components/auth/OfficeScreensCarousel'
import { TurnstileField, type TurnstileFieldHandle } from '@/shared/components/security/TurnstileField'
import { contabilPt as t } from '@/shared/i18n/contabilPt'
import { authClientLoginUrl, authClientRegisterUrl, authProfileChoiceUrl } from '@/shared/constants/authPaths'
import { useAuth } from '@/shared/hooks/useAuth'
import { useApiToast } from '@/shared/hooks/useApiToast'
import { isNoResponseError } from '@/shared/utils/requestTimeout'
import { getErrorMessage } from '@/shared/utils/errors'
import { warmupAuthLoginPage, withAuthLoginRetry } from '@/shared/utils/authLoginRetry'
import { withTurnstileToken } from '@/shared/security/withTurnstileToken'
import { isTurnstileEnabled, TURNSTILE_ACTIONS } from '@/shared/security/turnstile'
import { isInternalIdentifier, redactInternalIdentifiers, sanitizePublicLabel } from '@/shared/utils/sanitizePublicDisplay'
import { readClientLoginBranding } from '@/shared/utils/clientLoginBrandingStorage'
import { contabilPublicApi, prefetchAuthCsrf } from '@/infrastructure/api'
import { ServerWakingBanner } from '@/shared/components/feedback/ServerWakingUp'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { PasswordInput } from '@/shared/components/ui/password-input'
import { Label } from '@/shared/components/ui/label'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Obrigatório'),
  rememberMe: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function ClientLoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { loginClient } = useAuth()
  const toast = useApiToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverWaking, setServerWaking] = useState(false)
  const [serverWakingSince, setServerWakingSince] = useState<number>()
  const [passwordNotSetHint, setPasswordNotSetHint] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileFieldHandle | null>(null)

  const firmSlugRaw = params.get('firmSlug') || params.get('firm')
  const firmSlug =
    firmSlugRaw && !isInternalIdentifier(firmSlugRaw) ? firmSlugRaw.trim().toLowerCase() : undefined

  const brandingQuery = useQuery({
    queryKey: ['public-firm-branding', firmSlug],
    queryFn: () => contabilPublicApi.getFirmBranding(firmSlug!),
    enabled: Boolean(firmSlug),
    staleTime: 10 * 60_000,
    retry: false,
  })

  const firmDisplayName =
    sanitizePublicLabel(brandingQuery.data?.name) ||
    sanitizePublicLabel(readClientLoginBranding()?.name) ||
    undefined

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  const turnstileOk = !isTurnstileEnabled() || Boolean(turnstileToken)
  const canSubmit = form.formState.isValid && !isSubmitting && turnstileOk
  const errors = form.formState.errors

  useEffect(() => {
    const email = params.get('email')
    if (email) form.setValue('email', email)
  }, [params, form])

  useEffect(() => {
    if (!firmSlug) return
    const clean = new URLSearchParams(params)
    for (const key of ['firm', 'firmId'] as const) {
      const value = clean.get(key)
      if (value && isInternalIdentifier(value)) clean.delete(key)
    }
    if (clean.get('firmSlug') !== firmSlug) clean.set('firmSlug', firmSlug)
    clean.delete('firm')
    clean.delete('firmId')
    const search = clean.toString()
    navigate({ pathname: authClientLoginUrl(), search: search ? `?${search}` : '' }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- normalizar URL legada uma vez
  }, [])

  useEffect(() => {
    void warmupAuthLoginPage()
  }, [])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setServerWaking(false)
    setServerWakingSince(undefined)
    setPasswordNotSetHint(false)
    try {
      await withAuthLoginRetry(() =>
        loginClient(
          withTurnstileToken(
            {
              email: values.email.trim().toLowerCase(),
              password: values.password.trim(),
              rememberMe: values.rememberMe,
              firmSlug,
            },
            turnstileToken,
          ),
        ),
      )
      // Garante cookies same-origin antes de entrar no portal (evita loop no mobile).
      await prefetchAuthCsrf()
      navigate('/app/client', { replace: true })
    } catch (err: unknown) {
      turnstileRef.current?.reset()
      setTurnstileToken('')
      if (isNoResponseError(err)) {
        setServerWaking(true)
        setServerWakingSince((prev) => prev ?? Date.now())
        toast.error('Servidor a iniciar. Tente novamente em instantes.')
        return
      }
      if (err instanceof Error && /verificação de segurança/i.test(err.message)) {
        toast.error(err.message)
        return
      }
      const message = redactInternalIdentifiers(getErrorMessage(err))
      const code = isAxiosError(err)
        ? String(
            (err.response?.data as { code?: string; details?: { code?: string } } | undefined)?.code ||
              (err.response?.data as { details?: { code?: string } } | undefined)?.details?.code ||
              '',
          ).toUpperCase()
        : ''
      if (code.startsWith('TURNSTILE_')) {
        toast.error('Verificação de segurança falhou. Actualize a página e tente de novo.')
        return
      }
      if (code === 'PASSWORD_NOT_SET' || /ainda não definiu a palavra-passe|ainda não tem palavra-passe/i.test(message)) {
        setPasswordNotSetHint(true)
      }
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const subtitle = firmDisplayName
    ? `${t.auth.loginClientSubtitle} — ${firmDisplayName}`
    : t.auth.loginClientSubtitle

  return (
    <AuthLayout
      title="Entrar no Teglion"
      subtitle={subtitle}
      leftPanelSlot={<OfficeScreensCarousel />}
    >
      <div className="mx-auto max-w-md">
        <AuthCard>
          <AuthHeader
            title="Aceder ao portal"
            subtitle="Use as credenciais que o seu escritório lhe forneceu."
          />

          {serverWaking ? <ServerWakingBanner startedAt={serverWakingSince} className="mt-6" /> : null}

          {passwordNotSetHint ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-semibold">Ainda não há palavra-passe nesta conta</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-caption leading-relaxed text-amber-900/90">
                <li>Abra o email «Acesso ao portal» enviado pelo escritório.</li>
                <li>Clique no link do convite e defina a palavra-passe.</li>
                <li>Volte aqui e entre com o mesmo e-mail e a senha criada.</li>
              </ol>
              <p className="mt-2 text-caption text-amber-900/80">
                Se não encontrar o email, peça ao escritório um novo convite (ou que defina uma palavra-passe
                inicial).
              </p>
            </div>
          ) : null}

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                className="mt-3"
                placeholder="cliente@empresa.pt"
                {...form.register('email')}
              />
              {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email.message}</p> : null}
            </div>

            <div>
              <Label htmlFor="password">{t.auth.password}</Label>
              <div className="mt-3">
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  {...form.register('password')}
                />
              </div>
              {errors.password ? <p className="mt-2 text-sm text-red-600">{errors.password.message}</p> : null}
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <Checkbox
                  checked={form.watch('rememberMe')}
                  onCheckedChange={(v: CheckedState) => form.setValue('rememberMe', v === true)}
                />
                Lembrar-me
              </label>
              <Link to="/recover-password" state={{ role: 'client' }} className="text-sm font-medium text-[#0f2942] hover:underline">
                Esqueci a palavra-passe
              </Link>
            </div>

            <TurnstileField
              action={TURNSTILE_ACTIONS.LOGIN_CLIENT}
              onTokenChange={setTurnstileToken}
              fieldRef={turnstileRef}
            />

            <button type="submit" disabled={!canSubmit} className="cb-btn-primary h-12 w-full rounded-2xl disabled:opacity-60">
              {isSubmitting ? 'A entrar…' : 'Entrar'}
            </button>
          </form>
        </AuthCard>

        <AuthFooter className="mt-6">
          <Link to={authClientRegisterUrl()} className="font-semibold text-slate-900 hover:underline">
            Primeiro acesso
          </Link>
          <span className="mx-2">·</span>
          <Link to={authProfileChoiceUrl('login')} className="hover:underline">
            {t.auth.backChoice}
          </Link>
        </AuthFooter>
      </div>
    </AuthLayout>
  )
}
