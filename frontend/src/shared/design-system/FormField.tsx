import type { ReactNode } from 'react'
import { useId } from 'react'

import { cn } from '@/shared/lib/utils'

export type FormFieldProps = {
  label: string
  hint?: string
  error?: string
  required?: boolean
  /** id do controlo (input/select). Se omitido, gera-se um. */
  htmlFor?: string
  children: ReactNode
  className?: string
}

/**
 * Anatomia: Label → Campo → Ajuda → Erro
 * Passe `id={htmlFor}` no input e `aria-invalid` / `aria-describedby` quando possível.
 */
export function FormField({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className,
}: FormFieldProps) {
  const autoId = useId()
  const fieldId = htmlFor || autoId
  const hintId = `${fieldId}-hint`
  const errorId = `${fieldId}-error`

  return (
    <div className={cn('block space-y-1.5', className)}>
      <label htmlFor={fieldId} className="cb-field-label text-caption font-medium text-foreground">
        {label}
        {required ? (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={hintId} className="text-caption text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-caption text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
