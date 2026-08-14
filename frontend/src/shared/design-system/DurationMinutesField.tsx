import { useEffect, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'

import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'

const DEFAULT_PRESETS = [15, 30, 45, 60, 90, 120]

type Props = {
  value: number
  onChange: (minutes: number) => void
  min?: number
  max?: number
  className?: string
  inputClassName?: string
  /** Atalhos opcionais; passe `[]` para só input livre. */
  presets?: number[]
  id?: string
  'aria-label'?: string
}

/**
 * Duração em minutos — digitação livre (não “salta” ao apagar) + atalhos opcionais.
 */
export function DurationMinutesField({
  value,
  onChange,
  min = 15,
  max = 480,
  className,
  inputClassName,
  presets = DEFAULT_PRESETS,
  id,
  'aria-label': ariaLabel = 'Duração em minutos',
}: Props) {
  const [draft, setDraft] = useState(() => (Number.isFinite(value) && value > 0 ? String(value) : ''))

  useEffect(() => {
    setDraft(Number.isFinite(value) && value > 0 ? String(value) : '')
  }, [value])

  function commit(raw: string) {
    const digits = raw.replace(/\D/g, '')
    let n = digits === '' ? min : Number(digits)
    if (!Number.isFinite(n) || n < min) n = min
    if (n > max) n = max
    setDraft(String(n))
    onChange(n)
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={ariaLabel}
        className={cn('rounded-xl border-brand/20 bg-card', inputClassName)}
        value={draft}
        placeholder={String(min)}
        onChange={(e: FormChangeEvent) => {
          const next = e.target.value.replace(/\D/g, '')
          setDraft(next)
          if (next !== '') {
            const n = Number(next)
            if (Number.isFinite(n)) onChange(n)
          }
        }}
        onBlur={() => commit(draft)}
      />
      {presets.length ? (
        <div className="flex flex-wrap gap-1" role="group" aria-label="Atalhos de duração">
          {presets.map((p) => {
            const selected = value === p
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setDraft(String(p))
                  onChange(p)
                }}
                className={cn(
                  'rounded-full px-2 py-0.5 text-caption font-medium transition',
                  selected
                    ? 'bg-brand text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
              >
                {p} min
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
