import { type ChangeEvent } from 'react'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { PasswordInput } from '@/shared/components/ui/password-input'

const CONFIRM_COPY =
  'Para confirmar esta operação, introduza o código de segurança gerado pela aplicação autenticadora configurada na sua conta.'

type Props = {
  mfaEnabled: boolean
  totpCode: string
  currentPassword: string
  onTotpChange: (value: string) => void
  onPasswordChange: (value: string) => void
  idPrefix?: string
  /** Quando MFA off: pedir password de login (conta) vs vault (cofre). */
  passwordMode?: 'login' | 'vault'
}

/**
 * Campos partilhados de confirmação sensível — não duplicar MFA por botão.
 */
export function SensitiveActionConfirmFields({
  mfaEnabled,
  totpCode,
  currentPassword,
  onTotpChange,
  onPasswordChange,
  idPrefix = 'sensitive',
  passwordMode = 'login',
}: Props) {
  if (mfaEnabled) {
    return (
      <div className="space-y-2">
        <p className="text-sm leading-6 text-muted-foreground">{CONFIRM_COPY}</p>
        <p className="text-xs text-muted-foreground">
          O Teglion não envia este código por e-mail ou SMS.
        </p>
        <Label htmlFor={`${idPrefix}-totp`}>Código de 6 dígitos</Label>
        <Input
          id={`${idPrefix}-totp`}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          className="text-center tracking-[0.3em]"
          value={totpCode}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onTotpChange(e.target.value.replace(/\D/g, '').slice(0, 6))
          }
        />
      </div>
    )
  }

  const label =
    passwordMode === 'vault'
      ? 'Palavra-passe dos Acessos oficiais'
      : 'Palavra-passe de login'
  const hint =
    passwordMode === 'vault'
      ? 'Confirme com a palavra-passe do cofre (ou a de login, se ainda não criou a do cofre).'
      : 'Confirme com a sua palavra-passe de login do Teglion.'

  return (
    <div className="space-y-2">
      <p className="text-sm leading-6 text-muted-foreground">{hint}</p>
      <Label htmlFor={`${idPrefix}-password`}>{label}</Label>
      <PasswordInput
        id={`${idPrefix}-password`}
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onPasswordChange(e.target.value)}
      />
    </div>
  )
}

export function sensitiveConfirmReady(mfaEnabled: boolean, totpCode: string, currentPassword: string) {
  if (mfaEnabled) return totpCode.trim().length === 6
  return Boolean(currentPassword.trim())
}

export { CONFIRM_COPY as SENSITIVE_ACTION_MFA_COPY }
