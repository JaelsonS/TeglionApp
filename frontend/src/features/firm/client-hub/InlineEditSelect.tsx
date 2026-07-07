import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Label } from '@/shared/components/ui/label'

type Option = { value: string; label: string }

type Props = {
  label: string
  value: string
  options: Option[]
  onSave: (value: string) => void
  saving?: boolean
  placeholder?: string
  className?: string
}

export function InlineEditSelect({
  label,
  value,
  options,
  onSave,
  saving = false,
  placeholder = 'Seleccionar…',
  className,
}: Props) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  function commit(next: string) {
    if (next !== value) onSave(next)
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
      </div>
      <select
        className="cb-company-input h-9 w-full"
        value={draft}
        onChange={(e) => {
          const next = e.target.value
          setDraft(next)
          commit(next)
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
