import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { isAxiosError } from 'axios'

import { authApi } from '@/infrastructure/authApi'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useApiToast } from '@/shared/hooks/useApiToast'
import { useAuth } from '@/shared/hooks/useAuth'
import { getErrorMessage } from '@/shared/utils/errors'

type MfaStatus = {
  mfaEnabled?: boolean
  mfaEnabledAt?: string | null
  required?: boolean
}

const MFA_INVALID_GENERIC =
  'Não foi possível validar o código. Verifique o código apresentado na sua aplicação de autenticação e tente novamente.'

function mfaUserFacingError(err: unknown): string {
  if (isAxiosError(err)) {
    const code = String((err.response?.data as { code?: string })?.code || '').toUpperCase()
    if (code === 'MFA_INVALID_CODE' || err.response?.status === 401) return MFA_INVALID_GENERIC
  }
  const raw = getErrorMessage(err)
  if (/inválido|invalid|mfa/i.test(raw)) return MFA_INVALID_GENERIC
  return raw
}

function mapMfaStatus(data: {
  mfaEnabled?: boolean
  mfaEnabledAt?: string | null
  required?: boolean
} | null | undefined): MfaStatus {
  return {
    mfaEnabled: data?.mfaEnabled === true,
    mfaEnabledAt: data?.mfaEnabledAt ?? null,
    required: data?.required === true,
  }
}

export function FirmSettingsSecuritySection() {
  const toast = useApiToast()
  const toastRef = useRef(toast)
  toastRef.current = toast
  const { user } = useAuth()
  const [status, setStatus] = useState<MfaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  /**
   * useApiToast() devolve um objecto novo em cada render. Se `refresh` depender de `toast`,
   * o useEffect reentra em loop e a UI fica presa em «A carregar segurança…».
   */
  const refresh = useCallback(async (opts?: { silent?: boolean; notifyError?: boolean }) => {
    const silent = opts?.silent === true
    const notifyError = opts?.notifyError !== false
    if (!silent) setLoading(true)
    setLoadError(null)
    try {
      const data = await authApi.mfaStatus()
      setStatus(mapMfaStatus(data))
    } catch (err) {
      const message = mfaUserFacingError(err)
      setLoadError(message)
      if (notifyError) toastRef.current.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await authApi.mfaStatus()
        if (cancelled) return
        setStatus(mapMfaStatus(data))
      } catch (err) {
        if (cancelled) return
        setLoadError(mfaUserFacingError(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function startEnroll() {
    setBusy(true)
    setRecoveryCodes(null)
    setFieldError(null)
    try {
      const begin = await authApi.mfaEnrollBegin()
      setOtpauthUrl(begin.otpauthUrl || null)
    } catch (err) {
      toast.error(mfaUserFacingError(err))
    } finally {
      setBusy(false)
    }
  }

  async function confirmEnroll() {
    setBusy(true)
    setFieldError(null)
    try {
      const res = await authApi.mfaEnrollConfirm({ code: code.trim() })
      setRecoveryCodes(Array.isArray(res.recoveryCodes) ? res.recoveryCodes : [])
      setOtpauthUrl(null)
      setCode('')
      toast.success('Autenticação de dois factores activada.')
      await refresh({ silent: true })
    } catch (err) {
      const message = mfaUserFacingError(err)
      setFieldError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  async function regenerate() {
    setBusy(true)
    setFieldError(null)
    try {
      const res = await authApi.mfaRegenerateRecovery({ code: code.trim() })
      setRecoveryCodes(Array.isArray(res.recoveryCodes) ? res.recoveryCodes : [])
      setCode('')
      toast.success('Novos códigos de recuperação gerados. Os anteriores deixaram de ser válidos.')
      await refresh({ silent: true })
    } catch (err) {
      const message = mfaUserFacingError(err)
      setFieldError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    if (status?.required) {
      toast.error('O proprietário do escritório não pode desactivar a autenticação de dois factores.')
      return
    }
    setBusy(true)
    setFieldError(null)
    try {
      await authApi.mfaDisable({ code: code.trim() })
      setCode('')
      setRecoveryCodes(null)
      toast.success('Autenticação de dois factores desactivada.')
      await refresh({ silent: true })
    } catch (err) {
      const message = mfaUserFacingError(err)
      setFieldError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">A carregar segurança…</p>
  }

  if (loadError && !status) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-sm text-destructive" role="alert">
          Não foi possível carregar o estado de segurança. Tente novamente.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void refresh()}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Autenticação de dois factores</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {status?.required
            ? 'Obrigatório para o proprietário do escritório. Os códigos são gerados pela aplicação de autenticação — o Teglion não os envia por e-mail ou SMS.'
            : 'Opcional para a sua função. Os códigos são gerados pela aplicação de autenticação — o Teglion não os envia por e-mail ou SMS.'}
        </p>
        <p className="mt-2 text-sm">
          Estado: <strong>{status?.mfaEnabled ? 'Activo' : 'Inactivo'}</strong>
        </p>
        {user?.email ? (
          <p className="mt-1 text-xs text-muted-foreground">Conta: {user.email}</p>
        ) : null}
      </div>

      {!status?.mfaEnabled ? (
        <div className="space-y-4">
          {!otpauthUrl ? (
            <>
              <p className="text-sm leading-6 text-slate-600">
                Configure uma aplicação de autenticação compatível para gerar os seus códigos de
                segurança.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void startEnroll()}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
              >
                Configurar autenticação de dois factores
              </button>
            </>
          ) : (
            <>
              <p className="text-sm leading-6 text-slate-600">
                Escaneie o código QR com a sua aplicação de autenticação. Depois introduza o código de 6
                dígitos apresentado nessa aplicação para confirmar.
              </p>
              <p className="text-sm leading-6 text-slate-500">
                O Teglion não envia códigos de autenticação por e-mail ou SMS.
              </p>
              <div className="flex justify-center rounded-md border bg-white p-4">
                <QRCodeSVG
                  value={otpauthUrl}
                  size={160}
                  aria-label="Código QR para configurar a aplicação de autenticação"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sec-enroll-code">Código de 6 dígitos</Label>
                <Input
                  id="sec-enroll-code"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  aria-invalid={Boolean(fieldError)}
                  aria-describedby={fieldError ? 'sec-mfa-error' : undefined}
                  value={code}
                  onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                    setFieldError(null)
                    setCode(ev.target.value.replace(/\D/g, '').slice(0, 6))
                  }}
                />
                {fieldError ? (
                  <p id="sec-mfa-error" role="alert" className="text-sm text-destructive">
                    {fieldError}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                disabled={busy || code.length !== 6}
                onClick={() => void confirmEnroll()}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
              >
                Confirmar e activar
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para regenerar códigos de recuperação ou desactivar, introduza o código actual da sua
            aplicação de autenticação.
          </p>
          <div className="space-y-2">
            <Label htmlFor="sec-action-code">Código de 6 dígitos</Label>
            <Input
              id="sec-action-code"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? 'sec-mfa-error' : undefined}
              value={code}
              onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                setFieldError(null)
                setCode(ev.target.value.replace(/\D/g, '').slice(0, 6))
              }}
            />
            {fieldError ? (
              <p id="sec-mfa-error" role="alert" className="text-sm text-destructive">
                {fieldError}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || code.length !== 6}
              onClick={() => void regenerate()}
              className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
            >
              Regenerar códigos de recuperação
            </button>
            {!status.required ? (
              <button
                type="button"
                disabled={busy || code.length !== 6}
                onClick={() => void disable()}
                className="rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive disabled:opacity-60"
              >
                Desactivar MFA
              </button>
            ) : null}
          </div>
        </div>
      )}

      {recoveryCodes && recoveryCodes.length > 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            Guarde estes códigos de recuperação num local seguro. Cada um só pode ser usado uma vez.
          </p>
          <ul className="mt-3 grid gap-1 font-mono text-sm">
            {recoveryCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
