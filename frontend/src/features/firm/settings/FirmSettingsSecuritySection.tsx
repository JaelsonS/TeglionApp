import { useCallback, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

import { authApi } from '@/infrastructure/authApi'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useApiToast } from '@/shared/hooks/useApiToast'
import { useAuth } from '@/shared/hooks/useAuth'
import { getErrorMessage } from '@/shared/utils/errors'

type MfaStatus = {
  mfaEnabled?: boolean
  mfaEnabledAt?: string | null
  recoveryCodesRemaining?: number
  required?: boolean
}

export function FirmSettingsSecuritySection() {
  const toast = useApiToast()
  const { user } = useAuth()
  const [status, setStatus] = useState<MfaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await authApi.mfaStatus()
      setStatus(data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function startEnroll() {
    setBusy(true)
    setRecoveryCodes(null)
    try {
      const begin = await authApi.mfaEnrollBegin()
      setOtpauthUrl(begin.otpauthUrl || null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function confirmEnroll() {
    setBusy(true)
    try {
      const res = await authApi.mfaEnrollConfirm({ code: code.trim() })
      setRecoveryCodes(Array.isArray(res.recoveryCodes) ? res.recoveryCodes : [])
      setOtpauthUrl(null)
      setCode('')
      toast.success('MFA activado.')
      await refresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function regenerate() {
    setBusy(true)
    try {
      const res = await authApi.mfaRegenerateRecovery({ code: code.trim() })
      setRecoveryCodes(Array.isArray(res.recoveryCodes) ? res.recoveryCodes : [])
      setCode('')
      toast.success('Novos códigos gerados. Os anteriores deixaram de ser válidos.')
      await refresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    if (status?.required) {
      toast.error('O proprietário do escritório não pode desactivar o MFA.')
      return
    }
    setBusy(true)
    try {
      await authApi.mfaDisable({ code: code.trim() })
      setCode('')
      setRecoveryCodes(null)
      toast.success('MFA desactivado.')
      await refresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">A carregar segurança…</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Autenticação de dois factores (MFA)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {status?.required
            ? 'Obrigatório para o proprietário do escritório.'
            : 'Opcional para a sua função. Recomendado para proteger o acesso.'}
        </p>
        <p className="mt-2 text-sm">
          Estado:{' '}
          <strong>{status?.mfaEnabled ? 'Activo' : 'Inactivo'}</strong>
          {status?.mfaEnabled && typeof status.recoveryCodesRemaining === 'number'
            ? ` · ${status.recoveryCodesRemaining} códigos de recuperação restantes`
            : null}
        </p>
        {user?.email ? (
          <p className="mt-1 text-xs text-muted-foreground">Conta: {user.email}</p>
        ) : null}
      </div>

      {!status?.mfaEnabled ? (
        <div className="space-y-4">
          {!otpauthUrl ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void startEnroll()}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
            >
              Configurar MFA
            </button>
          ) : (
            <>
              <div className="flex justify-center rounded-md border bg-white p-4">
                <QRCodeSVG value={otpauthUrl} size={160} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sec-enroll-code">Código de confirmação</Label>
                <Input
                  id="sec-enroll-code"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
              <button
                type="button"
                disabled={busy || code.length !== 6}
                onClick={() => void confirmEnroll()}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
              >
                Activar MFA
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sec-mfa-code">Código TOTP (para regenerar ou desactivar)</Label>
            <Input
              id="sec-mfa-code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
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
        <div className="space-y-2 rounded-md border p-4">
          <p className="text-sm font-medium">Códigos de recuperação (mostre uma vez)</p>
          <ul className="grid grid-cols-1 gap-1 font-mono text-sm sm:grid-cols-2">
            {recoveryCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
