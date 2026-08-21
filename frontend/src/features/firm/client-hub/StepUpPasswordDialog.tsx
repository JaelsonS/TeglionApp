import { useState } from 'react'
import { Shield } from 'lucide-react'

import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import {
  SensitiveActionConfirmFields,
  SENSITIVE_ACTION_MFA_COPY,
  sensitiveConfirmReady,
} from '@/shared/components/security/SensitiveActionConfirmFields'
import { PasswordInput } from '@/shared/components/ui/password-input'
import { FormField } from '@/shared/design-system'

type ConfirmResult = {
  currentPassword?: string
  totpCode?: string
  rememberSession: boolean
}

type Props = {
  open: boolean
  title?: string
  description?: string
  confirmLabel?: string
  error?: string | null
  /** Quando true, pede TOTP em vez da password do cofre. */
  mfaEnabled?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (result: ConfirmResult) => void | Promise<void>
}

export function StepUpPasswordDialog({
  open,
  title = 'Confirmar identidade',
  description,
  confirmLabel = 'Confirmar',
  error,
  mfaEnabled = false,
  onOpenChange,
  onConfirm,
}: Props) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [rememberSession, setRememberSession] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)

  const resolvedDescription =
    description ||
    (mfaEnabled
      ? SENSITIVE_ACTION_MFA_COPY
      : 'Para continuar, introduza a palavra-passe dos Acessos oficiais. Esta confirmação fica registada.')

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setCurrentPassword('')
          setTotpCode('')
          setLocalError(null)
          setRememberSession(true)
        }
        onOpenChange(next)
      }}
      title={title}
      description={resolvedDescription}
      confirmLabel={confirmLabel}
      testId="official-access-step-up"
      onConfirm={async () => {
        if (!sensitiveConfirmReady(mfaEnabled, totpCode, currentPassword)) {
          setLocalError(
            mfaEnabled
              ? 'Indique o código de 6 dígitos da aplicação autenticadora.'
              : 'Indique a palavra-passe dos Acessos oficiais.',
          )
          return
        }
        setLocalError(null)
        await onConfirm(
          mfaEnabled
            ? { totpCode: totpCode.trim(), rememberSession }
            : { currentPassword: currentPassword.trim(), rememberSession },
        )
        setCurrentPassword('')
        setTotpCode('')
      }}
    >
      {mfaEnabled ? (
        <SensitiveActionConfirmFields
          idPrefix="vault-step-up"
          mfaEnabled
          totpCode={totpCode}
          currentPassword=""
          onTotpChange={setTotpCode}
          onPasswordChange={() => undefined}
        />
      ) : (
        <>
          <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <p>
              Esta palavra-passe é só deste campo (Acessos oficiais). Não é a senha dos portais do Estado
              nem a de entrar no Teglion, se entra com Google.
            </p>
          </div>
          <FormField className="mt-3" label="Palavra-passe dos Acessos oficiais" htmlFor="official-access-step-up-password">
            <PasswordInput
              id="official-access-step-up-password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="A palavra-passe deste cofre"
            />
          </FormField>
        </>
      )}
      <label className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={rememberSession}
          onChange={(e) => setRememberSession(e.target.checked)}
        />
        <span>
          Memorizar confirmação neste browser (sessão curta do cofre). Não use em computadores
          partilhados.
        </span>
      </label>
      {localError || error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {localError || error}
        </p>
      ) : null}
    </ConfirmDialog>
  )
}
