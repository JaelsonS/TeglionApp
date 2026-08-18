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
  onConfirm: (currentPassword: string, options: { rememberSession: boolean }) => void | Promise<void>
}

export function StepUpPasswordDialog({
  open,
  title = 'Confirmar identidade',
  description = 'Para continuar, introduza a palavra-passe dos Acessos oficiais. Esta confirmação fica registada.',
  confirmLabel = 'Confirmar',
  error,
  onOpenChange,
  onConfirm,
}: Props) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [rememberSession, setRememberSession] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setCurrentPassword('')
          setLocalError(null)
          setRememberSession(true)
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
          setLocalError('Indique a palavra-passe dos Acessos oficiais.')
          return
        }
        setLocalError(null)
        await onConfirm(value, { rememberSession })
        setCurrentPassword('')
      }}
    >
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
      <label className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={rememberSession}
          onChange={(e) => setRememberSession(e.target.checked)}
        />
        <span>
          Manter desbloqueado nesta sessão (neste separador). A palavra-passe em si nunca fica
          guardada no browser.
        </span>
      </label>
      {localError || error ? (
        <p className="mt-2 text-caption text-destructive" role="alert">
          {localError || error}
        </p>
      ) : null}
    </ConfirmDialog>
  )
}
