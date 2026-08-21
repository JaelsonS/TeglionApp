import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

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

export function FirmMfaChallengePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const toast = useApiToast()
  const { setSession } = useAuth()

  const reason = params.get('reason') === 'enroll' ? 'enroll' : 'challenge'
  const [step, setStep] = useState<Step>(reason === 'enroll' ? 'enroll-qr' : 'challenge')
  const [code, setCode] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [emailHint, setEmailHint] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const status = await authApi.mfaChallengeStatus(getMfaChallengeToken() || undefined)
        if (cancelled) return
        if (status?.user?.email) setEmailHint(String(status.user.email))
        if (status?.mfa?.challengeToken) setMfaChallengeToken(status.mfa.challengeToken)
        if (status.status === 'MFA_ENROLLMENT_REQUIRED' || reason === 'enroll') {
          setStep('enroll-qr')
          const begin = await authApi.mfaEnrollBegin(getMfaChallengeToken() || undefined)
          if (!cancelled) setOtpauthUrl(begin.otpauthUrl || null)
        } else {
          setStep('challenge')
        }
      } catch {
        if (reason === 'enroll') {
          try {
            const begin = await authApi.mfaEnrollBegin(getMfaChallengeToken() || undefined)
            if (!cancelled) {
              setStep('enroll-qr')
              setOtpauthUrl(begin.otpauthUrl || null)
            }
          } catch (err) {
            toast.error(getErrorMessage(err))
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

  async function onVerifyChallenge(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await authApi.mfaChallengeVerify({
        challengeToken: getMfaChallengeToken() || undefined,
        code: useRecovery ? undefined : code.trim(),
        recoveryCode: useRecovery ? recoveryCode.trim() : undefined,
      })
      clearMfaChallengeToken()
      if (!setSession(res.user)) throw new Error('Sessão inválida após MFA.')
      toast.success('Autenticação de dois factores confirmada.')
      void prefetchAuthCsrf()
      navigate('/app', { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function onConfirmEnroll(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await authApi.mfaEnrollConfirm({
        code: code.trim(),
        challengeToken: getMfaChallengeToken() || undefined,
      })
      clearMfaChallengeToken()
      if (!setSession(res.user)) throw new Error('Sessão inválida após enrollment MFA.')
      setRecoveryCodes(Array.isArray(res.recoveryCodes) ? res.recoveryCodes : [])
      setStep('recovery')
      toast.success('MFA activado. Guarde os códigos de recuperação.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Autenticação de dois factores" subtitle="Teglion">
      <AuthCard>
        <AuthHeader
          title={
            step === 'recovery'
              ? 'Códigos de recuperação'
              : step === 'challenge'
                ? 'Confirme o código'
                : 'Configure o autenticador'
          }
          subtitle={
            emailHint
              ? `Conta: ${emailHint}`
              : 'Protecção extra da conta do escritório.'
          }
        />

        {step === 'challenge' ? (
          <form className="space-y-4" onSubmit={onVerifyChallenge}>
            {!useRecovery ? (
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Código de 6 dígitos</Label>
                <Input
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(ev) => setCode(ev.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="mfa-recovery">Código de recuperação</Label>
                <Input
                  id="mfa-recovery"
                  value={recoveryCode}
                  onChange={(ev) => setRecoveryCode(ev.target.value.toUpperCase())}
                  required
                />
              </div>
            )}
            <button
              type="button"
              className="text-sm text-muted-foreground underline"
              onClick={() => setUseRecovery((v) => !v)}
            >
              {useRecovery ? 'Usar código da app' : 'Usar código de recuperação'}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60"
            >
              {busy ? 'A verificar…' : 'Continuar'}
            </button>
          </form>
        ) : null}

        {step === 'enroll-qr' ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escaneie o QR com Google Authenticator, 1Password, Authy ou similar. O segredo nunca fica
              guardado no browser.
            </p>
            {otpauthUrl ? (
              <div className="flex justify-center rounded-md bg-white p-4">
                <QRCodeSVG value={otpauthUrl} size={180} />
              </div>
            ) : (
              <p className="text-sm">A preparar QR…</p>
            )}
            <button
              type="button"
              className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground"
              onClick={() => setStep('enroll-confirm')}
              disabled={!otpauthUrl}
            >
              Já escaneei — introduzir código
            </button>
          </div>
        ) : null}

        {step === 'enroll-confirm' ? (
          <form className="space-y-4" onSubmit={onConfirmEnroll}>
            <div className="space-y-2">
              <Label htmlFor="enroll-code">Código de confirmação (6 dígitos)</Label>
              <Input
                id="enroll-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(ev) => setCode(ev.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60"
            >
              {busy ? 'A activar…' : 'Activar MFA'}
            </button>
          </form>
        ) : null}

        {step === 'recovery' ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Guarde estes códigos num local seguro. Cada um só funciona uma vez. Não serão mostrados
              novamente.
            </p>
            <ul className="grid grid-cols-1 gap-1 font-mono text-sm sm:grid-cols-2">
              {recoveryCodes.map((c) => (
                <li key={c} className="rounded border px-2 py-1">
                  {c}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground"
              onClick={() => {
                void prefetchAuthCsrf()
                navigate('/app', { replace: true })
              }}
            >
              Entrar no escritório
            </button>
          </div>
        ) : null}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/auth/firm/login">Voltar ao login</Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}
