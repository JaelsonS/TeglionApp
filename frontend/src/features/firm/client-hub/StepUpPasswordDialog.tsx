import { useState } from 'react'
import { Shield } from 'lucide-react'

import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { PasswordInput } from '@/shared/components/ui/password-input'
import { FormField } from '@/shared/design-system'

type Props = {
  open: boolean
  title?: string
  description?: string
  confirmLabel?: string
  error?: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: (currentPassword: string) => void | Promise<void>
}

export function StepUpPasswordDialog({
  open,
  title = 'Confirmar identidade',
  description = 'Para continuar, introduza a sua palavra-passe do Teglion. Esta confirmação fica registada.',
  confirmLabel = 'Confirmar',
  error,
  onOpenChange,
  onConfirm,
}: Props) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setCurrentPassword('')
          setLocalError(null)
        }
        onOpenChange(next)
      }}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      testId="official-access-step-up"
      onConfirm={async () => {
        const value = currentPassword.trim()
        if (!value) {
          setLocalError('Indique a sua palavra-passe do Teglion.')
          return
        }
        setLocalError(null)
        await onConfirm(value)
        setCurrentPassword('')
      }}
    >
      <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        <p>Nunca pedimos a senha dos portais do Estado. Só a sua conta Teglion.</p>
      </div>
      <FormField className="mt-3" label="Palavra-passe do Teglion" htmlFor="official-access-step-up-password">
        <PasswordInput
          id="official-access-step-up-password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="A sua palavra-passe"
        />
      </FormField>
      {localError || error ? (
        <p className="mt-2 text-caption text-destructive" role="alert">
          {localError || error}
        </p>
      ) : null}
    </ConfirmDialog>
  )
}
