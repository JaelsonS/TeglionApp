import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { isAxiosError } from 'axios'

import { AuthCard } from '@/shared/components/auth/AuthCard'
import { AuthHeader } from '@/shared/components/auth/AuthHeader'
import { AuthLayout } from '@/shared/components/auth/AuthLayout'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { authApi } from '@/infrastructure/authApi'
import { useAuth } from '@/shared/hooks/useAuth'
import { useApiToast } from '@/shared/hooks/useApiToast'
import { getErrorMessage } from '@/shared/utils/errors'
import {
  clearMfaChallengeToken,
  getMfaChallengeToken,
  setMfaChallengeToken,
} from '@/shared/security/mfaChallengeStore'
import { prefetchAuthCsrf } from '@/infrastructure/api'

type Step = 'challenge' | 'enroll-qr' | 'enroll-confirm' | 'recovery'

const MFA_INVALID_GENERIC =
  'Não foi possível validar o código. Verifique o código apresentado na sua aplicação de autenticação e tente novamente.'

const MFA_TEMP_GENERIC =
  'O código não pôde ser validado. Abra a sua aplicação de autenticação e introduza o código atualmente apresentado.'

function mfaUserFacingError(err: unknown): string {
  if (isAxiosError(err)) {
    const code = String((err.response?.data as { code?: string })?.code || '').toUpperCase()
    if (code === 'MFA_INVALID_CODE' || code === 'MFA_CHALLENGE_INVALID' || err.response?.status === 401) {
      return MFA_INVALID_GENERIC
    }
    if (code === 'RATE_LIMIT' || err.response?.status === 429) {
      return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
    }
  }
  const raw = getErrorMessage(err)
  if (/inválido|invalid|expirad|expired|mfa/i.test(raw)) return MFA_TEMP_GENERIC
  return raw
}

export function FirmMfaChallengePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const toast = useApiToast()
  const { setSession } = useAuth()

  const reason = params.get('reason') === 'enroll' ? 'enroll' : 'challenge'
  const [step, setStep] = useState<Step>(reason === 'enroll' ? 'enroll-qr' : 'challenge')
  const [ownerEnrollment, setOwnerEnrollment] = useState(reason === 'enroll')
  const [code, setCode] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const status = await authApi.mfaChallengeStatus(getMfaChallengeToken() || undefined)
        if (cancelled) return
        if (status?.mfa?.challengeToken) setMfaChallengeToken(status.mfa.challengeToken)
        if (status.status === 'MFA_ENROLLMENT_REQUIRED' || reason === 'enroll') {
          setOwnerEnrollment(true)
          setStep('enroll-qr')
          const begin = await authApi.mfaEnrollBegin(getMfaChallengeToken() || undefined)
          if (!cancelled) setOtpauthUrl(begin.otpauthUrl || null)
        } else {
          setOwnerEnrollment(false)
          setStep('challenge')
        }
      } catch {
        if (reason === 'enroll') {
          try {
            const begin = await authApi.mfaEnrollBegin(getMfaChallengeToken() || undefined)
            if (!cancelled) {
              setOwnerEnrollment(true)
              setStep('enroll-qr')
              setOtpauthUrl(begin.otpauthUrl || null)
            }
          } catch (err) {
            toast.error(mfaUserFacingError(err))
          }
        }
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once on mount / reason
  }, [reason])

  async function onVerifyChallenge(e: FormEvent) {
    e.preventDefault()
    setFieldError(null)
    setBusy(true)
    try {
      const res = await authApi.mfaChallengeVerify({
        challengeToken: getMfaChallengeToken() || undefined,
        code: useRecovery ? undefined : code.trim(),
        recoveryCode: useRecovery ? recoveryCode.trim() : undefined,
      })
      clearMfaChallengeToken()
      if (!setSession(res.user)) throw new Error('Sessão inválida após autenticação.')
      toast.success('Identidade confirmada.')
      void prefetchAuthCsrf()
      navigate('/app', { replace: true })
    } catch (err) {
      const message = mfaUserFacingError(err)
      setFieldError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  async function onConfirmEnroll(e: FormEvent) {
    e.preventDefault()
    setFieldError(null)
    setBusy(true)
    try {
      const res = await authApi.mfaEnrollConfirm({
        code: code.trim(),
        challengeToken: getMfaChallengeToken() || undefined,
      })
      clearMfaChallengeToken()
      if (!setSession(res.user)) throw new Error('Sessão inválida após configuração.')
      setRecoveryCodes(Array.isArray(res.recoveryCodes) ? res.recoveryCodes : [])
      setStep('recovery')
      toast.success('Autenticação de dois factores activada.')
    } catch (err) {
      const message = mfaUserFacingError(err)
      setFieldError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  const headerTitle =
    step === 'recovery'
      ? 'Autenticação de dois factores activada'
      : step === 'challenge'
        ? 'Autenticação de dois factores'
        : 'Configure uma aplicação de autenticação'

  const headerSubtitle =
    step === 'recovery'
      ? 'Na próxima vez que iniciar sessão, será necessário introduzir o código apresentado na sua aplicação de autenticação.'
      : step === 'challenge'
        ? 'Confirme a sua identidade'
        : ownerEnrollment
          ? 'Para proteger a conta do proprietário do escritório, é necessário configurar a autenticação de dois factores antes de continuar.'
          : 'Use uma aplicação de autenticação compatível para configurar o Teglion.'

  return (
    <AuthLayout title="Autenticação de dois factores" subtitle="Teglion">
      <AuthCard>
        <AuthHeader title={headerTitle} subtitle={headerSubtitle} showBrand compact />

        {step === 'challenge' ? (
          <form className="mt-6 space-y-4" onSubmit={onVerifyChallenge} noValidate>
            {!useRecovery ? (
              <>
                <p className="text-sm leading-6 text-slate-600">
                  Abra a aplicação de autenticação que configurou para o Teglion e introduza o código de
                  segurança apresentado.
                </p>
                <p className="text-sm leading-6 text-slate-500">
                  O código é temporário e é gerado pela sua aplicação de autenticação. O Teglion não envia
                  este código por e-mail.
                </p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-sm font-medium text-slate-800">Como obter o código?</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Abra a aplicação de autenticação que configurou para o Teglion. O código de 6 dígitos
                    apresentado nessa aplicação muda periodicamente.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mfa-code">Código de 6 dígitos</Label>
                  <Input
                    id="mfa-code"
                    name="otp"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={6}
                    placeholder="000000"
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? 'mfa-code-error' : 'mfa-code-hint'}
                    className="h-12 text-center text-lg tracking-[0.35em] sm:text-xl"
                    value={code}
                    onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                      setFieldError(null)
                      setCode(ev.target.value.replace(/\D/g, '').slice(0, 6))
                    }}
                    required
                  />
                  <p id="mfa-code-hint" className="sr-only">
                    Introduza o código de seis dígitos da sua aplicação de autenticação.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm leading-6 text-slate-600">
                  Introduza um dos códigos de recuperação que guardou quando configurou a autenticação de
                  dois factores.
                </p>
                <p className="text-sm leading-6 text-slate-500">
                  Cada código de recuperação só pode ser utilizado uma vez.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="mfa-recovery">Código de recuperação</Label>
                  <Input
                    id="mfa-recovery"
                    name="recovery"
                    autoComplete="off"
                    autoFocus
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? 'mfa-code-error' : undefined}
                    className="h-12 font-mono tracking-wide"
                    value={recoveryCode}
                    onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                      setFieldError(null)
                      setRecoveryCode(ev.target.value.toUpperCase())
                    }}
                    required
                  />
                </div>
              </>
            )}

            {fieldError ? (
              <p id="mfa-code-error" role="alert" className="text-sm text-destructive">
                {fieldError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy || (!useRecovery && code.length !== 6) || (useRecovery && !recoveryCode.trim())}
              className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {busy ? 'A verificar…' : 'Continuar'}
            </button>

            <button
              type="button"
              className="w-full text-center text-sm text-slate-600 underline underline-offset-2"
              onClick={() => {
                setUseRecovery((v) => !v)
                setFieldError(null)
                setCode('')
                setRecoveryCode('')
              }}
            >
              {useRecovery ? 'Usar código da aplicação de autenticação' : 'Usar código de recuperação'}
            </button>
          </form>
        ) : null}

        {step === 'enroll-qr' ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              Configure uma aplicação de autenticação compatível (por exemplo Google Authenticator,
              Microsoft Authenticator ou 1Password) para o Teglion.
            </p>
            <p className="text-sm leading-6 text-slate-500">
              O Teglion não envia códigos de autenticação por e-mail ou SMS. Os códigos são gerados pela
              aplicação de autenticação configurada por si.
            </p>
            {otpauthUrl ? (
              <div className="flex justify-center rounded-md border border-slate-200 bg-white p-4">
                <QRCodeSVG value={otpauthUrl} size={180} aria-label="Código QR para configurar a aplicação de autenticação" />
              </div>
            ) : (
              <p className="text-sm text-slate-600">A preparar a configuração…</p>
            )}
            <button
              type="button"
              className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
              onClick={() => {
                setCode('')
                setFieldError(null)
                setStep('enroll-confirm')
              }}
              disabled={!otpauthUrl}
            >
              Já adicionei — introduzir código
            </button>
          </div>
        ) : null}

        {step === 'enroll-confirm' ? (
          <form className="mt-6 space-y-4" onSubmit={onConfirmEnroll} noValidate>
            <p className="text-sm leading-6 text-slate-600">
              Depois de adicionar o Teglion à sua aplicação, introduza o código de 6 dígitos apresentado
              para confirmar a configuração.
            </p>
            <div className="space-y-2">
              <Label htmlFor="enroll-code">Código de 6 dígitos</Label>
              <Input
                id="enroll-code"
                name="otp"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                placeholder="000000"
                aria-invalid={Boolean(fieldError)}
                aria-describedby={fieldError ? 'mfa-code-error' : undefined}
                className="h-12 text-center text-lg tracking-[0.35em] sm:text-xl"
                value={code}
                onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                  setFieldError(null)
                  setCode(ev.target.value.replace(/\D/g, '').slice(0, 6))
                }}
                required
              />
            </div>
            {fieldError ? (
              <p id="mfa-code-error" role="alert" className="text-sm text-destructive">
                {fieldError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {busy ? 'A confirmar…' : 'Confirmar configuração'}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm text-slate-600 underline underline-offset-2"
              onClick={() => {
                setFieldError(null)
                setStep('enroll-qr')
              }}
            >
              Voltar ao código QR
            </button>
          </form>
        ) : null}

        {step === 'recovery' ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              Guarde os seus códigos de recuperação num local seguro. Eles podem ser utilizados para
              recuperar o acesso caso perca acesso à sua aplicação de autenticação.
            </p>
            <p className="text-sm leading-6 text-slate-500">
              Cada código só funciona uma vez. Esta é a única vez em que os códigos são mostrados.
            </p>
            <ul className="grid grid-cols-1 gap-1 font-mono text-sm sm:grid-cols-2">
              {recoveryCodes.map((c) => (
                <li key={c} className="rounded border border-slate-200 px-2 py-1.5">
                  {c}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
              onClick={() => {
                void prefetchAuthCsrf()
                navigate('/app', { replace: true })
              }}
            >
              Concluir
            </button>
          </div>
        ) : null}

        {step !== 'recovery' ? (
          <p className="mt-6 text-center text-sm text-slate-500">
            <Link to="/auth/firm/login" className="underline underline-offset-2">
              Voltar ao login
            </Link>
          </p>
        ) : null}
      </AuthCard>
    </AuthLayout>
  )
}
