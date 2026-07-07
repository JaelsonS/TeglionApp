import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { CheckedState } from '@radix-ui/react-checkbox'

import { AuthCard } from '@/shared/components/auth/AuthCard'
import { AuthDivider } from '@/shared/components/auth/AuthDivider'
import { AuthFooter } from '@/shared/components/auth/AuthFooter'
import { AuthHeader } from '@/shared/components/auth/AuthHeader'
import { AuthLayout } from '@/shared/components/auth/AuthLayout'
import { GoogleAuthButton } from '@/shared/components/auth/GoogleAuthButton'
import { OfficeScreensCarousel } from '@/shared/components/auth/OfficeScreensCarousel'
import { contabilPt as t } from '@/shared/i18n/contabilPt'
import { authFirmRegisterUrl, authProfileChoiceUrl } from '@/shared/constants/authPaths'
import { useAuth } from '@/shared/hooks/useAuth'
import { useApiToast } from '@/shared/hooks/useApiToast'
import { getGoogleAuthStartUrl, prefetchAuthCsrf } from '@/infrastructure/api'
import { isNoResponseError } from '@/shared/utils/requestTimeout'
import { getErrorMessage } from '@/shared/utils/errors'
import { warmupAuthLoginPage, withAuthLoginRetry } from '@/shared/utils/authLoginRetry'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Obrigatório'),
  rememberMe: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const SSO_ERROR_MESSAGES: Record<string, string> = {
  sso_disabled: 'Login com Google não está disponível de momento.',
  google_denied: 'Login com Google cancelado.',
  invalid_state: 'Sessão expirada. Tente entrar com Google novamente.',
  email_unverified: 'Confirme o e-mail na conta Google antes de continuar.',
  account_not_found:
    'Não encontrámos escritório com este e-mail Google. Crie uma conta ou use e-mail e palavra-passe.',
  account_inactive: 'Conta desactivada. Contacte o administrador do escritório.',
  sso_mismatch: 'Esta conta Google não corresponde ao escritório registado. Use o e-mail correcto ou contacte o suporte.',
  sso_failed: 'Não foi possível entrar com Google. Tente novamente.',
}

export function FirmLoginPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { loginFirm } = useAuth()
  const toast = useApiToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverWaking, setServerWaking] = useState(false)
  const [ssoError, setSsoError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  const canSubmit = form.formState.isValid && !isSubmitting

  useEffect(() => {
    void warmupAuthLoginPage()
  }, [])

  useEffect(() => {
    const code = params.get('error')
    if (!code) return
    const message = SSO_ERROR_MESSAGES[code] || 'Não foi possível entrar com Google.'
    setSsoError(message)
    toast.error(message)
    const next = new URLSearchParams(params)
    next.delete('error')
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- processar ?error= uma vez ao voltar do OAuth
  }, [])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setServerWaking(false)
    try {
      await withAuthLoginRetry(async () => {
        const res = await loginFirm({
          email: values.email.trim().toLowerCase(),
          password: values.password.trim(),
          rememberMe: values.rememberMe,
        })
        if (res.firmAccess?.hasAccess === false && res.firmAccess.reason === 'TRIAL_EXPIRED') {
          navigate('/app/firm/billing', { replace: true })
          return
        }
        navigate('/app', { replace: true })
        void prefetchAuthCsrf()
      })
    } catch (err: unknown) {
      if (isNoResponseError(err)) {
        setServerWaking(true)
        toast.error('Servidor a iniciar. Tente novamente em instantes.')
        return
      }
      toast.error(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const errors = form.formState.errors

  return (
    <AuthLayout
      title="Bem-vindo(a) ao Teglion"
      subtitle="A plataforma moderna para escritórios de contabilidade."
      leftPanelSlot={<OfficeScreensCarousel />}
    >
      <div className="mx-auto max-w-md">
        <AuthCard>
          <AuthHeader
            title="Entrar no seu escritório"
            subtitle="Use o e-mail e a palavra-passe do seu escritório para continuar."
          />

          <div className="mt-6 rounded-2xl border border-[#0f2942]/10 bg-[#0f2942]/5 px-4 py-3 text-sm text-slate-700">
            Entre com os dados do escritório para retomar o trabalho de onde parou.
          </div>

          {serverWaking ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Servidor a iniciar…
            </div>
          ) : null}

          {ssoError ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {ssoError}
            </div>
          ) : null}

          <form id="email-login" onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
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
                placeholder="contato@escritorio.pt"
                {...form.register('email')}
              />
              {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email.message}</p> : null}
            </div>

            <div>
              <Label htmlFor="password">{t.auth.password}</Label>
              <div className="relative mt-3">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="pr-11"
                  placeholder="••••••••••"
                  {...form.register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? <p className="mt-2 text-sm text-red-600">{errors.password.message}</p> : null}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#0f2942] to-[#195285] text-white shadow-[0_14px_28px_rgba(15,41,66,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'A entrar…' : 'Entrar'}
            </button>

            <AuthDivider label="ou" />

            <GoogleAuthButton
              href={getGoogleAuthStartUrl({ intent: 'login' })}
              label="Continuar com Google"
              disabled={ssoError != null}
            />

            <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/recover-password" className="font-medium text-slate-900 hover:underline">
                Esqueci a palavra-passe
              </Link>
              <Link to={authFirmRegisterUrl()} className="font-medium text-slate-900 hover:underline">
                Criar conta
              </Link>
            </div>
          </form>
        </AuthCard>

        <AuthFooter className="mt-6">
          <Link to={authProfileChoiceUrl('login')} className="font-semibold text-slate-900 hover:underline">
            Voltar à escolha de perfil
          </Link>
        </AuthFooter>
      </div>
    </AuthLayout>
  )
}

