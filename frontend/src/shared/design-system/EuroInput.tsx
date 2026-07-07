import { useEffect, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'

import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'

/** Input de euros (pt-PT) — valor interno em euros decimais (não cêntimos). */
export function EuroInput({
  value,
  onChange,
  className,
  placeholder = '0,00',
}: {
  value: number
  onChange: (euros: number) => void
  className?: string
  placeholder?: string
}) {
  const [draft, setDraft] = useState(() => formatDraft(value))

  useEffect(() => {
    setDraft(formatDraft(value))
  }, [value])

  function formatDraft(n: number) {
    if (!n || Number.isNaN(n)) return ''
    return new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
  }

  function parseDraft(s: string): number {
    const cleaned = s.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
    const n = parseFloat(cleaned)
    return Number.isFinite(n) ? n : 0
  }

  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        €
      </span>
      <Input
        inputMode="decimal"
        className="rounded-xl border-border/50 bg-background/80 pl-8"
        placeholder={placeholder}
        value={draft}
        onChange={(e: FormChangeEvent) => {
          setDraft(e.target.value)
          onChange(parseDraft(e.target.value))
        }}
        onBlur={() => setDraft(formatDraft(parseDraft(draft)))}
      />
    </div>
  )
}
