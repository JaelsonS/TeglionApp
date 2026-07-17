import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'> & {
  /** Classes extra no botão do olho */
  toggleClassName?: string
}

/**
 * Input de palavra-passe com olho para mostrar/ocultar o que o utilizador está a digitar.
 * Não revela senhas guardadas no servidor (só o texto do próprio campo).
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, toggleClassName, disabled, ...props }, ref) {
    const [visible, setVisible] = React.useState(false)

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-11', className)}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
            toggleClassName,
          )}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
          disabled={disabled}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    )
  },
)
