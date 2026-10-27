/**
 * Login dedicado do Teglion Control Center.
 * Separado do login dos gabinetes — sem Google, sem registo, só allowlist + MFA.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { KeyRound, Lock, Shield } from 'lucide-react'

import { AuthCard } from '@/shared/components/auth/AuthCard'
import { AuthFooter } from '@/shared/components/auth/AuthFooter'
import { AuthHeader } from '@/shared/components/auth/AuthHeader'
import { AuthLayout } from '@/shared/components/auth/AuthLayout'
import { AuthAgencyIdentity } from '@/shared/components/auth/AuthAgencyIdentity'
import { TurnstileField, type TurnstileFieldHandle } from '@/shared/components/security/TurnstileField'
import { ServerWakingBanner } from '@/shared/components/feedback/ServerWakingUp'
import { Input } from '@/shared/components/ui/input'
import { PasswordInput } from '@/shared/components/ui/password-input'
import { Label } from '@/shared/components/ui/label'
import { authOpsMfaUrl, authOpsRecoverPasswordUrl } from '@/shared/constants/authPaths'
import { useAuth } from '@/shared/hooks/useAuth'
import { useApiToast } from '@/shared/hooks/useApiToast'
import { clearMfaChallengeToken } from '@/shared/security/mfaChallengeStore'
import { clearClientCsrfCache, prefetchAuthCsrf } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { isNoResponseError } from '@/shared/utils/requestTimeout'
import { warmupAuthLoginPage, withAuthLoginRetry } from '@/shared/utils/authLoginRetry'
import { withTurnstileToken } from '@/shared/security/withTurnstileToken'
import { isTurnstileEnabled, TURNSTILE_ACTIONS } from '@/shared/security/turnstile'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Obrigatório'),
})

type FormValues = z.infer<typeof schema>

function OpsSecurityPanel() {
  return (
    <div className="space-y-4">
      <Feature
        icon={<Lock className="h-4 w-4" />}
        text="Sessão em cookie HttpOnly sobre HTTPS — a palavra-passe não fica no browser nem na URL."
      />
      <Feature
        icon={<KeyRound className="h-4 w-4" />}
        text="MFA TOTP obrigatória em cada entrada. Só o email da allowlist AfDigital acede."
      />
      <Feature
        icon={<Shield className="h-4 w-4" />}
        text="Este ecrã é só para o Control Center. Gabinetes usam o login comercial em separado."
      />
    </div>
  )
}

function Feature({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm leading-relaxed text-primary-foreground/90">
      <span className="mt-0.5 shrink-0 text-primary-foreground">{icon}</span>
      <p>{text}</p>
    </div>
  )
}

export function PlatformOpsLoginPage() {
  const navigate = useNavigate()
  const { loginFirm, logout } = useAuth()
  const toast = useApiToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverWaking, setServerWaking] = useState(false)
  const [serverWakingSince, setServerWakingSince] = useState<number>()
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileFieldHandle | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const turnstileOk = !isTurnstileEnabled() || Boolean(turnstileToken)
  const canSubmit = form.formState.isValid && !isSubmitting && turnstileOk

  useEffect(() => {
    clearMfaChallengeToken()
    void warmupAuthLoginPage()
  }, [])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setServerWaking(false)
    setServerWakingSince(undefined)
    try {
      await withAuthLoginRetry(async () => {
        const payload = withTurnstileToken(
          {
            email: values.email.trim().toLowerCase(),
            password: values.password.trim(),
            rememberMe: false,
          },
          turnstileToken,
        )
        const res = await loginFirm(payload)

        if (res.status === 'MFA_CHALLENGE_REQUIRED' || res.status === 'MFA_ENROLLMENT_REQUIRED') {
          clearClientCsrfCache()
          const reason = res.status === 'MFA_ENROLLMENT_REQUIRED' ? 'enroll' : 'challenge'
          navigate(authOpsMfaUrl(reason), {
            replace: true,
            state: {
              mfaChallengeToken: res.mfa?.challengeToken ?? null,
              mfaExpiresAt: res.mfa?.expiresAt ?? null,
            },
          })
          return
        }

        if (!res.user?.platformOps) {
          await logout()
          toast.error('Esta conta não tem acesso ao Control Center.')
          return
        }

        navigate('/app/ops', { replace: true })
        void prefetchAuthCsrf()
      })
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
      if (isAxiosError(err)) {
        const code = String((err.response?.data as { code?: string })?.code || '').toUpperCase()
        if (code.startsWith('TURNSTILE_')) {
          toast.error('Verificação de segurança falhou. Actualize a página e tente de novo.')
          return
        }
      }
      toast.error(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const errors = form.formState.errors

  return (
    <AuthLayout
      title="Teglion Control Center"
      subtitle="Acesso interno AfDigital — Soluções Tecnológicas. Não é o login dos gabinetes."
      leftPanelSlot={<OpsSecurityPanel />}
    >
      <div className="mx-auto max-w-md">
        <AuthCard>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-medium text-brand">
            <Shield className="h-3.5 w-3.5" aria-hidden />
            Operações internas
          </div>
          <AuthHeader
            title="Entrar no Control Center"
            subtitle="Email allowlist + palavra-passe + MFA. Sem registo público nem Google nesta área."
          />

          {serverWaking ? <ServerWakingBanner startedAt={serverWakingSince} className="mt-6" /> : null}

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5" autoComplete="on">
            <div>
              <Label htmlFor="ops-email">E-mail do operador</Label>
              <Input
                id="ops-email"
                type="email"
                autoComplete="username"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                className="mt-3"
                placeholder="operador@…"
                {...form.register('email')}
              />
              {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email.message}</p> : null}
            </div>

            <div>
              <Label htmlFor="ops-password">Palavra-passe</Label>
              <div className="mt-3">
                <PasswordInput
                  id="ops-password"
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  {...form.register('password')}
                />
              </div>
              {errors.password ? (
                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
              ) : null}
            </div>

            <TurnstileField
              action={TURNSTILE_ACTIONS.LOGIN_FIRM}
              onTokenChange={setTurnstileToken}
              fieldRef={turnstileRef}
            />

            <button
              type="submit"
              disabled={!canSubmit}
              className="h-12 w-full rounded-2xl bg-slate-900 text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'A verificar…' : 'Continuar com MFA'}
            </button>

            <div className="text-center">
              <Link
                to={authOpsRecoverPasswordUrl()}
                state={{ role: 'firm', audience: 'ops' }}
                className="text-sm font-medium text-slate-900 underline-offset-2 hover:underline"
              >
                Redefinir palavra-passe
              </Link>
            </div>

            <p className="text-center text-xs leading-relaxed text-slate-500">
              Ligação HTTPS · cookie de sessão HttpOnly · desafio MFA em cada login · allowlist de 1 email.
            </p>
          </form>
        </AuthCard>

        <AuthFooter className="mt-6">
          <AuthAgencyIdentity />
          <p className="mt-3 text-center text-xs text-slate-500">
            É um gabinete?{' '}
            <Link to="/auth/firm/login" className="font-medium text-slate-900 underline-offset-2 hover:underline">
              Login comercial
            </Link>
          </p>
        </AuthFooter>
      </div>
    </AuthLayout>
  )
}
