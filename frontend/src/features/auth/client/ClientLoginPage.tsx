import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { CheckedState } from '@radix-ui/react-checkbox'

import { AuthCard } from '@/shared/components/auth/AuthCard'
import { AuthFooter } from '@/shared/components/auth/AuthFooter'
import { AuthHeader } from '@/shared/components/auth/AuthHeader'
import { AuthLayout } from '@/shared/components/auth/AuthLayout'
import { OfficeScreensCarousel } from '@/shared/components/auth/OfficeScreensCarousel'
import { contabilPt as t } from '@/shared/i18n/contabilPt'
import { authClientLoginUrl, authClientRegisterUrl, authProfileChoiceUrl } from '@/shared/constants/authPaths'
import { useAuth } from '@/shared/hooks/useAuth'
import { useApiToast } from '@/shared/hooks/useApiToast'
import { isNoResponseError } from '@/shared/utils/requestTimeout'
import { getErrorMessage } from '@/shared/utils/errors'
import { warmupAuthLoginPage, withAuthLoginRetry } from '@/shared/utils/authLoginRetry'
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

  const canSubmit = form.formState.isValid && !isSubmitting
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
    try {
      await withAuthLoginRetry(() =>
        loginClient({
          email: values.email.trim().toLowerCase(),
          password: values.password.trim(),
          rememberMe: values.rememberMe,
          firmSlug,
        }),
      )
      // Garante cookies same-origin antes de entrar no portal (evita loop no mobile).
      await prefetchAuthCsrf()
      navigate('/app/client', { replace: true })
    } catch (err: unknown) {
      if (isNoResponseError(err)) {
        setServerWaking(true)
        setServerWakingSince((prev) => prev ?? Date.now())
        toast.error('Servidor a iniciar. Tente novamente em instantes.')
        return
      }
      toast.error(redactInternalIdentifiers(getErrorMessage(err)))
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
