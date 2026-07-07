import { useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Search } from 'lucide-react'

import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'
import { safeDisplayText } from '@/shared/utils/safeDisplayText'
import type { Client } from '@/shared/types/clients'

type Props = {
  clients: Client[]
  value: string
  onChange: (clientId: string) => void
  placeholder?: string
  className?: string
}

export function ClientSearchSelect({
  clients,
  value,
  onChange,
  placeholder = 'Pesquisar cliente (nome, e-mail, NIF)…',
  className,
}: Props) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return clients.slice(0, 80)
    return clients.filter((c) => {
      const hay = [c.name, c.fullName, c.displayName, c.email, c.taxId]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(query)
    })
  }, [clients, q])

  const selected = clients.find((c) => c._id === value)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e: FormChangeEvent) => setQ(e.target.value)}
          placeholder={placeholder}
          className="rounded-full pl-9"
        />
      </div>
      {selected ? (
        <p className="text-xs text-muted-foreground">
          Selecionado: <span className="font-medium text-foreground">{safeDisplayText(selected.fullName || selected.name)}</span>
          {selected.taxId ? ` · NIF ${selected.taxId}` : ''}
        </p>
      ) : null}
      <div className="max-h-40 overflow-y-auto rounded-xl border border-border/70 bg-muted/20 p-1">
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum cliente encontrado.</p>
        ) : (
          filtered.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => {
                onChange(c._id)
                setQ('')
              }}
              className={cn(
                'flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-background',
                value === c._id && 'bg-background font-medium ring-1 ring-brand/30',
              )}
            >
              <span>{safeDisplayText(c.fullName || c.name || c.displayName, 'Cliente')}</span>
              <span className="text-xs text-muted-foreground">
                {[c.email, c.taxId ? `NIF ${c.taxId}` : null].filter(Boolean).join(' · ')}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
