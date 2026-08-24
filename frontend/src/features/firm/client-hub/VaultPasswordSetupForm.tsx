import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { PasswordInput } from '@/shared/components/ui/password-input'
import { Label } from '@/shared/components/ui/label'
import { firmSettingsApi } from '@/infrastructure/api/contabil/firmSettings'
import { getErrorMessage } from '@/shared/utils/errors'
import { PASSWORD_MIN_LENGTH, passwordPolicyMessages } from '@/shared/utils/passwordPolicy'
import { persistVaultStepUpFromResponse } from '@/features/firm/client-hub/vaultStepUpSession'
import type { FormChangeEvent } from '@/shared/types/react-events'

type Props = {
  userId?: string
  /** F-10: com MFA activo, rodar esta palavra-passe também exige TOTP. */
  mfaEnabled?: boolean
  hasVaultPassword: boolean
  hasLoginPassword: boolean
  compact?: boolean
  hideIntro?: boolean
  onUpdated?: () => void
}

export function VaultPasswordSetupForm({
  userId,
  mfaEnabled = false,
  hasVaultPassword,
  hasLoginPassword,
  compact = false,
  hideIntro = false,
  onUpdated,
}: Props) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [saving, setSaving] = useState(false)

  const needsCurrent = hasVaultPassword || hasLoginPassword

  const onSave = async () => {
    if (!newPassword) {
      toast.error('Indique a nova palavra-passe dos Acessos oficiais.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('A confirmação não coincide.')
      return
    }
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      toast.error(passwordPolicyMessages.minLength)
      return
    }
    if (needsCurrent && !currentPassword) {
      toast.error(
        hasVaultPassword
          ? 'Confirme a palavra-passe actual deste cofre.'
          : 'Confirme a palavra-passe com que entra no Teglion.',
      )
      return
    }
    if (mfaEnabled && totpCode.trim().length !== 6) {
      toast.error('Introduza o código de 6 dígitos da aplicação autenticadora.')
      return
    }
    setSaving(true)
    try {
      const result = await firmSettingsApi.setVaultPassword({
        newPassword,
        currentPassword: needsCurrent ? currentPassword : undefined,
        totpCode: mfaEnabled ? totpCode.trim() : undefined,
      })
      persistVaultStepUpFromResponse(userId, result, true, 'vault_mutate')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTotpCode('')
      toast.success(
        hasVaultPassword
          ? 'Palavra-passe dos Acessos oficiais actualizada.'
          : 'Palavra-passe dos Acessos oficiais criada. Já pode ver e gravar senhas.',
      )
      onUpdated?.()
    } catch (err) {
      toast.error('Não foi possível guardar esta palavra-passe', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {hideIntro ? null : (
      <p className="text-sm leading-relaxed text-muted-foreground">
        Esta palavra-passe é <strong className="text-foreground">só para Acessos oficiais</strong> —
        ver, copiar ou gravar senhas dos portais. Não serve para entrar no Teglion. Se entra com
        Google, é esta a confirmação que passa a usar neste campo.
        {compact ? (
          <>
            {' '}
            Também pode gerir em{' '}
            <Link to="/app/firm/settings?tab=perfil" className="font-medium text-foreground underline">
              Definições → O seu perfil
            </Link>
            .
          </>
        ) : null}
      </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
      {needsCurrent ? (
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={compact ? 'vault-current-compact' : 'vault-current'}>
            {hasVaultPassword ? 'Palavra-passe actual deste cofre' : 'Palavra-passe de entrada no Teglion'}
          </Label>
          <PasswordInput
            id={compact ? 'vault-current-compact' : 'vault-current'}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e: FormChangeEvent) => setCurrentPassword(e.target.value)}
            disabled={saving}
          />
        </div>
      ) : null}
        <div className="space-y-1.5">
          <Label htmlFor={compact ? 'vault-new-compact' : 'vault-new'}>Nova palavra-passe deste campo</Label>
          <PasswordInput
            id={compact ? 'vault-new-compact' : 'vault-new'}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e: FormChangeEvent) => setNewPassword(e.target.value)}
            disabled={saving}
            placeholder={`Mín. ${PASSWORD_MIN_LENGTH} caracteres`}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={compact ? 'vault-confirm-compact' : 'vault-confirm'}>Confirmar</Label>
          <PasswordInput
            id={compact ? 'vault-confirm-compact' : 'vault-confirm'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e: FormChangeEvent) => setConfirmPassword(e.target.value)}
            disabled={saving}
          />
        </div>
        {mfaEnabled ? (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={compact ? 'vault-totp-compact' : 'vault-totp'}>
              Código da aplicação autenticadora
            </Label>
            <p className="text-xs text-muted-foreground">
              Com a autenticação de dois factores activa, também precisa do código actual para rodar
              esta palavra-passe. O Teglion não envia este código por e-mail ou SMS.
            </p>
            <Input
              id={compact ? 'vault-totp-compact' : 'vault-totp'}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              className="max-w-[10rem] text-center tracking-[0.3em]"
              value={totpCode}
              onChange={(e: FormChangeEvent) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={saving}
            />
          </div>
        ) : null}
      </div>
      <Button type="button" className="rounded-lg" disabled={saving} onClick={() => void onSave()}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {hasVaultPassword ? 'Actualizar palavra-passe deste campo' : 'Criar palavra-passe deste campo'}
      </Button>
    </div>
  )
}
