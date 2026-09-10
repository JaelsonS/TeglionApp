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

type RotateStep = 'idle' | 'prove' | 'scan'

type ProofMode = 'totp' | 'recovery'

const MFA_INVALID_GENERIC =
  'Esse código não bate certo. Confirme o que está na aplicação (ou o código de recuperação) e tente outra vez.'

function mfaUserFacingError(err: unknown): string {
  if (isAxiosError(err)) {
    const code = String((err.response?.data as { code?: string })?.code || '').toUpperCase()
    if (code === 'MFA_INVALID_CODE' || err.response?.status === 401) return MFA_INVALID_GENERIC
    if (code === 'MFA_PROOF_REQUIRED') {
      return 'Precisa do código da app actual ou de um código de recuperação guardado.'
    }
    if (code === 'MFA_ROTATE_NOT_STARTED') {
      return 'A troca ainda não foi iniciada. Comece de novo a partir do passo anterior.'
    }
    if (code === 'MFA_REQUIRED_FOR_OWNER') {
      return 'Como é a dona do escritório, a autenticação de dois factores não pode ser desligada — só trocada por outra aplicação.'
    }
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
  const [recoveryInput, setRecoveryInput] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [rotateStep, setRotateStep] = useState<RotateStep>('idle')
  const [proofMode, setProofMode] = useState<ProofMode>('totp')
  const [panel, setPanel] = useState<'none' | 'rotate' | 'recovery'>('none')

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

  function resetActionFields() {
    setCode('')
    setRecoveryInput('')
    setFieldError(null)
  }

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
      toast.success('Pronto — a autenticação de dois factores ficou activa.')
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
      toast.success('Novos códigos gerados. Os antigos já não servem.')
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
      toast.error(
        'Como é a dona do escritório, não dá para desligar isto — só trocar a aplicação.',
      )
      return
    }
    setBusy(true)
    setFieldError(null)
    try {
      await authApi.mfaDisable({ code: code.trim() })
      setCode('')
      setRecoveryCodes(null)
      setPanel('none')
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

  async function startRotate() {
    setBusy(true)
    setFieldError(null)
    try {
      const payload =
        proofMode === 'recovery'
          ? { recoveryCode: recoveryInput.trim() }
          : { code: code.trim() }
      const begin = await authApi.mfaRotateBegin(payload)
      setOtpauthUrl(begin.otpauthUrl || null)
      resetActionFields()
      setRotateStep('scan')
      toast.success('Pode configurar a app nova. A antiga continua a funcionar até confirmar.')
    } catch (err) {
      const message = mfaUserFacingError(err)
      setFieldError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  async function confirmRotate() {
    setBusy(true)
    setFieldError(null)
    try {
      const res = await authApi.mfaRotateConfirm({ code: code.trim() })
      setRecoveryCodes(Array.isArray(res.recoveryCodes) ? res.recoveryCodes : [])
      setOtpauthUrl(null)
      setCode('')
      setRotateStep('idle')
      setPanel('none')
      toast.success('App nova activa. Guarde os códigos de recuperação novos.')
      await refresh({ silent: true })
    } catch (err) {
      const message = mfaUserFacingError(err)
      setFieldError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  async function cancelRotate() {
    setBusy(true)
    try {
      await authApi.mfaRotateCancel()
      setOtpauthUrl(null)
      setRotateStep('idle')
      setPanel('none')
      resetActionFields()
      toast.success('Troca cancelada. Continua a usar a aplicação que já tinha.')
    } catch (err) {
      toast.error(mfaUserFacingError(err))
    } finally {
      setBusy(false)
    }
  }

  function openRotate() {
    setPanel('rotate')
    setRotateStep('prove')
    setProofMode('totp')
    setRecoveryCodes(null)
    setOtpauthUrl(null)
    resetActionFields()
  }

  function openRecoveryPanel() {
    setPanel('recovery')
    setRotateStep('idle')
    setOtpauthUrl(null)
    setRecoveryCodes(null)
    resetActionFields()
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
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {status?.required
            ? 'É obrigatória para quem gere o escritório. Os códigos vêm da aplicação no telemóvel — o Teglion não os envia por e-mail nem por SMS.'
            : 'Opcional para a sua função. Os códigos vêm da aplicação no telemóvel — o Teglion não os envia por e-mail nem por SMS.'}
        </p>
        <p className="mt-2 text-sm">
          Estado: <strong>{status?.mfaEnabled ? 'Activa' : 'Inactiva'}</strong>
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
                Escolha uma aplicação de autenticação (Google Authenticator, Microsoft Authenticator,
                Authy ou semelhante), escaneie o QR e confirme com o código de 6 dígitos.
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
                Escaneie o QR com a aplicação. Depois escreva aqui o código de 6 dígitos que ela
                mostrar.
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
        <div className="space-y-6">
          {panel === 'none' && rotateStep === 'idle' ? (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-600">
                Mudou de telemóvel ou quer outra aplicação? Pode trocar sem desligar a protecção.
                Enquanto não confirmar a app nova, a antiga continua a funcionar.
              </p>
              <p className="text-sm leading-6 text-slate-600">
                Se perdeu o telemóvel e ainda tem um dos códigos de recuperação que guardou na
                activação, use-o para iniciar a troca. Não enviamos códigos de autenticação por
                e-mail — isso abriria a conta a quem tivesse acesso à caixa de correio.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={openRotate}
                  className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
                >
                  Trocar aplicação de autenticação
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={openRecoveryPanel}
                  className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
                >
                  Regenerar códigos de recuperação
                </button>
                {!status.required ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setPanel('recovery')
                      resetActionFields()
                    }}
                    className="rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive disabled:opacity-60"
                  >
                    Desactivar
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {panel === 'rotate' && rotateStep === 'prove' ? (
            <div className="space-y-4">
              <h3 className="text-base font-medium">Trocar aplicação</h3>
              <p className="text-sm leading-6 text-slate-600">
                Primeiro confirmamos que é mesmo você. Use o código da app que ainda tem no
                telemóvel ou, se já não a tem, um código de recuperação.
              </p>
              <div className="flex flex-wrap gap-2 text-sm">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setProofMode('totp')
                    resetActionFields()
                  }}
                  className={
                    proofMode === 'totp'
                      ? 'rounded-md bg-slate-900 px-3 py-1.5 text-white'
                      : 'rounded-md border px-3 py-1.5'
                  }
                >
                  Tenho a app actual
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setProofMode('recovery')
                    resetActionFields()
                  }}
                  className={
                    proofMode === 'recovery'
                      ? 'rounded-md bg-slate-900 px-3 py-1.5 text-white'
                      : 'rounded-md border px-3 py-1.5'
                  }
                >
                  Perdi o telemóvel — uso recuperação
                </button>
              </div>
              {proofMode === 'totp' ? (
                <div className="space-y-2">
                  <Label htmlFor="sec-rotate-proof-totp">Código de 6 dígitos da app actual</Label>
                  <Input
                    id="sec-rotate-proof-totp"
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
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="sec-rotate-proof-recovery">Código de recuperação</Label>
                  <Input
                    id="sec-rotate-proof-recovery"
                    autoComplete="off"
                    placeholder="Ex.: A1B2C-D3E4F"
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? 'sec-mfa-error' : undefined}
                    value={recoveryInput}
                    onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                      setFieldError(null)
                      setRecoveryInput(ev.target.value.trim().toUpperCase())
                    }}
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Cada código só funciona uma vez. Depois da troca vai receber uma lista nova —
                    guarde-a noutro sítio seguro (gestor de palavras-passe, papel no cofre, etc.).
                  </p>
                </div>
              )}
              {fieldError ? (
                <p id="sec-mfa-error" role="alert" className="text-sm text-destructive">
                  {fieldError}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={
                    busy ||
                    (proofMode === 'totp' ? code.length !== 6 : recoveryInput.trim().length < 8)
                  }
                  onClick={() => void startRotate()}
                  className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
                >
                  Continuar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPanel('none')
                    setRotateStep('idle')
                    resetActionFields()
                  }}
                  className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}

          {panel === 'rotate' && rotateStep === 'scan' && otpauthUrl ? (
            <div className="space-y-4">
              <h3 className="text-base font-medium">Configure a aplicação nova</h3>
              <p className="text-sm leading-6 text-slate-600">
                Abra a aplicação nova (ou a mesma noutro telemóvel), adicione uma conta e escaneie
                este QR. Quando o código de 6 dígitos aparecer, introduza-o abaixo. Só depois disso
                a app antiga deixa de ser válida.
              </p>
              <div className="flex justify-center rounded-md border bg-white p-4">
                <QRCodeSVG
                  value={otpauthUrl}
                  size={160}
                  aria-label="Código QR para a nova aplicação de autenticação"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sec-rotate-confirm">Código de 6 dígitos da app nova</Label>
                <Input
                  id="sec-rotate-confirm"
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
                  onClick={() => void confirmRotate()}
                  className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
                >
                  Confirmar app nova
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void cancelRotate()}
                  className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
                >
                  Cancelar troca
                </button>
              </div>
            </div>
          ) : null}

          {panel === 'recovery' ? (
            <div className="space-y-4">
              <h3 className="text-base font-medium">Códigos de recuperação</h3>
              <p className="text-sm leading-6 text-slate-600">
                Para emitir códigos novos
                {!status.required ? ' (ou desactivar a autenticação)' : ''}, confirme com o código
                actual da aplicação. Os códigos antigos deixam de funcionar assim que gerar os
                novos.
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
                  className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
                >
                  Gerar códigos novos
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
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPanel('none')
                    resetActionFields()
                  }}
                  className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
                >
                  Voltar
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {recoveryCodes && recoveryCodes.length > 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            Guarde estes códigos agora — não voltam a aparecer.
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-900/90">
            Servem se perder o telemóvel. Cada um só pode ser usado uma vez. Não os partilhe por
            e-mail nem por chat.
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
