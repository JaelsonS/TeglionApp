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
  hasVaultPassword?: boolean
  hasLoginPassword?: boolean
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
  hasVaultPassword = false,
  hasLoginPassword = false,
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

  const passwordHint = !mfaEnabled
    ? hasVaultPassword
      ? 'Use a palavra-passe que criou para Acessos oficiais (Definições → O seu perfil).'
      : hasLoginPassword
        ? 'Ainda não criou uma palavra-passe só para este campo? Pode usar a palavra-passe com que entra no Teglion — ou crie uma dedicada abaixo.'
        : 'Ainda não tem palavra-passe de Acessos oficiais. Crie uma neste ecrã (banner amarelo) ou em Definições → O seu perfil — não é a senha Google.'
    : null

  const passwordLabel = hasVaultPassword
    ? 'Palavra-passe dos Acessos oficiais'
    : hasLoginPassword
      ? 'Palavra-passe de confirmação'
      : 'Palavra-passe dos Acessos oficiais'

  const passwordPlaceholder = hasVaultPassword
    ? 'A palavra-passe deste cofre'
    : hasLoginPassword
      ? 'Palavra-passe de entrada no Teglion'
      : 'Crie primeiro a palavra-passe do cofre'

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
              : hasLoginPassword || hasVaultPassword
                ? 'Indique a palavra-passe de confirmação.'
                : 'Crie primeiro a palavra-passe dos Acessos oficiais (banner amarelo neste ecrã).',
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
            <div className="space-y-2">
              <p>
                Esta confirmação protege as senhas dos portais do Estado (AT, SS, ViaCTT…). Não confunda
                com a senha do portal do cliente nem com a conta Google.
              </p>
              {passwordHint ? <p className="font-medium text-foreground/90">{passwordHint}</p> : null}
              {!hasVaultPassword && !hasLoginPassword ? (
                <ol className="list-decimal space-y-1 pl-4">
                  <li>No banner amarelo acima, crie uma palavra-passe só para Acessos oficiais.</li>
                  <li>Volte a guardar ou ver a senha do portal — use essa palavra-passe aqui.</li>
                </ol>
              ) : !hasVaultPassword && hasLoginPassword ? (
                <ol className="list-decimal space-y-1 pl-4">
                  <li>Use a palavra-passe com que entra no Teglion, ou</li>
                  <li>Crie uma palavra-passe dedicada em Definições → O seu perfil (recomendado).</li>
                </ol>
              ) : null}
            </div>
          </div>
          <FormField className="mt-3" label={passwordLabel} htmlFor="official-access-step-up-password">
            <PasswordInput
              id="official-access-step-up-password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={passwordPlaceholder}
              disabled={!hasVaultPassword && !hasLoginPassword}
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
