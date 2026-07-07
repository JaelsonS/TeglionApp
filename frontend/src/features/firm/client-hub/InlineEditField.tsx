import { useEffect, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import type { KeyboardEvent } from 'react'
import { Check, Loader2 } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

type Props = {
  label: string
  value: string
  onSave: (value: string) => void
  saving?: boolean
  multiline?: boolean
  placeholder?: string
  className?: string
}

export function InlineEditField({
  label,
  value,
  onSave,
  saving = false,
  multiline = false,
  placeholder,
  className,
}: Props) {
  const [draft, setDraft] = useState(value)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setDraft(value)
    setDirty(false)
  }, [value])

  function commit() {
    if (!dirty || draft === value) return
    onSave(draft)
    setDirty(false)
  }

  const fieldClass = cn(
    'cb-field-control',
    dirty && 'border-primary/40 ring-1 ring-primary/10',
  )

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-label="A guardar" />
        ) : dirty ? (
          <button
            type="button"
            onClick={commit}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Check className="h-3 w-3" />
            Guardar
          </button>
        ) : null}
      </div>
      {multiline ? (
        <textarea
          className={cn(fieldClass, 'min-h-[88px] w-full resize-y px-3 py-2 text-sm')}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => {
            setDraft(e.target.value)
            setDirty(true)
          }}
          onBlur={commit}
        />
      ) : (
        <Input
          className={fieldClass}
          value={draft}
          placeholder={placeholder}
          onChange={(e: FormChangeEvent) => {
            setDraft(e.target.value)
            setDirty(true)
          }}
          onBlur={commit}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
          }}
        />
      )}
    </div>
  )
}
