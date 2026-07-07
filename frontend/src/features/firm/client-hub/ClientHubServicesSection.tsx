import { useQuery } from '@tanstack/react-query'

import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { cn } from '@/shared/lib/utils'

type Props = {
  selected: string[]
  saving?: boolean
  onChange: (serviceIds: string[]) => void
}

export function ClientHubServicesSection({ selected, saving, onChange }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['accounting-services', 'active', 'hub'],
    queryFn: () => contabilAccountingServicesApi.list({ activeOnly: true }),
    staleTime: 120_000,
  })

  const services =
    (data as { items?: { id: string; name: string }[] })?.items?.filter((s) => s.name) || []

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">A carregar serviços…</p>
  }

  if (services.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum serviço configurado no escritório. Configure em Definições.
      </p>
    )
  }

  return (
    <div className={cn('grid gap-2 sm:grid-cols-2', saving && 'pointer-events-none opacity-70')}>
      {services.map((s) => {
        const checked = selected.includes(s.id)
        return (
          <label
            key={s.id}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
              checked ? 'border-brand/40 bg-brand/[0.06]' : 'border-border/70 hover:bg-muted/30',
            )}
          >
            <input
              type="checkbox"
              className="rounded border-border"
              checked={checked}
              onChange={() => {
                const next = checked ? selected.filter((id) => id !== s.id) : [...selected, s.id]
                onChange(next)
              }}
            />
            <span className="font-medium">{s.name}</span>
          </label>
        )
      })}
    </div>
  )
}
