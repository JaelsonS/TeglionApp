import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, Search, User, X } from 'lucide-react'

import { fetchClientHub } from '@/infrastructure/api/contabil/clientHub'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { useFirmClientsDirectory } from '@/shared/hooks/queries/useFirmClientsDirectory'
import { cn } from '@/shared/lib/utils'
import type { FirmCalculatorId } from '@/features/firm/fiscal/calculatorsCatalog'

export type CalculatorClientHints = {
  clientId: string
  displayName: string
  taxId?: string | null
  clientType?: string | null
  vatRegime?: string | null
  irsFramework?: string | null
  spouse?: boolean | null
  ssOneYearExemption?: boolean | null
  /** Prefills sugeridos — a calculadora aplica o que fizer sentido. */
  suggestedFilingStatus?: 'single' | 'joint'
  suggestedCalcId?: FirmCalculatorId
  suggestedSsTi?: boolean
  suggestedIrc?: boolean
}

type Props = {
  clientId: string
  onClientIdChange: (id: string) => void
  onHints?: (hints: CalculatorClientHints | null) => void
  /** Filtrar histórico / contexto só deste cliente */
  className?: string
}

export function CalculatorClientBar({ clientId, onClientIdChange, onHints, className }: Props) {
  const [q, setQ] = useState('')
  const clientsQuery = useFirmClientsDirectory({ limit: 500 })
  const clients = clientsQuery.data?.items || []

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return clients.slice(0, 80)
    return clients
      .filter((c) => {
        const hay = [c.displayName, c.fullName, c.name, c.taxId].filter(Boolean).join(' ').toLowerCase()
        return hay.includes(term)
      })
      .slice(0, 80)
  }, [clients, q])

  const hubQuery = useQuery({
    queryKey: ['calc-client-hub', clientId],
    queryFn: () => fetchClientHub(clientId),
    enabled: Boolean(clientId),
    staleTime: 60_000,
  })

  const selected = useMemo(() => {
    if (!clientId) return null
    return clients.find((c) => (c._id || c.id) === clientId) || null
  }, [clients, clientId])

  useEffect(() => {
    if (!onHints) return
    if (!clientId) {
      onHints(null)
      return
    }
    const hub = hubQuery.data
    const profile = hub?.client?.fiscalProfile
    const name =
      hub?.client?.displayName ||
      selected?.displayName ||
      selected?.fullName ||
      selected?.name ||
      'Cliente'
    const spouse = profile?.identification?.spouse
    const framework = profile?.irsFramework || null
    const type = hub?.client?.clientType || (selected as { clientType?: string } | null)?.clientType || null
    const hints: CalculatorClientHints = {
      clientId,
      displayName: name,
      taxId: hub?.client?.taxId || selected?.taxId || null,
      clientType: type,
      vatRegime: profile?.vatRegime || null,
      irsFramework: framework,
      spouse: spouse ?? null,
      ssOneYearExemption: profile?.socialSecurity?.oneYearExemption ?? null,
      suggestedFilingStatus: spouse ? 'joint' : 'single',
      suggestedSsTi: type === 'SELF_EMPLOYED' || /cat\.?\s*b|independente/i.test(String(framework || '')),
      suggestedIrc: /^IRC/i.test(String(framework || '')) || type === 'COMPANY',
      suggestedCalcId: (() => {
        if (type === 'COMPANY' || /^IRC/i.test(String(framework || ''))) return 'irc'
        if (type === 'SELF_EMPLOYED') return 'ss'
        return 'irs'
      })(),
    }
    onHints(hints)
  }, [clientId, hubQuery.data, selected, onHints])

  return (
    <div className={cn('cb-calc-client-bar', className)} data-testid="calc-client-bar">
      <div className="cb-calc-client-bar-hd">
        <p className="cb-calc-client-bar-title">Cliente da carteira</p>
        <p className="cb-calc-client-bar-sub">
          Associe a simulação e puxe NIF, regime e contexto fiscal. Valores (€) e dependentes continuam manuais —
          o perfil ainda não guarda salário nem matéria coletável.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Procurar por nome ou NIF…"
            aria-label="Procurar cliente"
          />
        </div>
        <select
          className="flex h-10 min-w-[14rem] rounded-md border border-input bg-background px-3 text-sm sm:max-w-sm"
          value={clientId}
          onChange={(e) => onClientIdChange(e.target.value)}
          aria-label="Seleccionar cliente"
        >
          <option value="">— Sem cliente —</option>
          {filtered.map((c) => {
            const id = c._id || c.id
            const name = c.displayName || c.fullName || c.name || id
            const nif = c.taxId ? ` · ${c.taxId}` : ''
            return (
              <option key={id} value={id}>
                {name}
                {nif}
              </option>
            )
          })}
        </select>
        {clientId ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onClientIdChange('')}>
            <X className="mr-1 h-4 w-4" aria-hidden />
            Limpar
          </Button>
        ) : null}
      </div>

      {clientId && hubQuery.isLoading ? (
        <p className="text-xs text-muted-foreground">A carregar perfil fiscal…</p>
      ) : null}

      {clientId && hubQuery.data ? (
        <div className="cb-calc-client-chips" aria-label="Contexto do cliente">
          <Chip
            icon={hubQuery.data.client.clientType === 'COMPANY' ? Building2 : User}
            label={hubQuery.data.client.displayName || selected?.displayName || 'Cliente'}
          />
          {hubQuery.data.client.taxId ? <Chip label={`NIF ${hubQuery.data.client.taxId}`} /> : null}
          {hubQuery.data.client.clientType ? (
            <Chip label={clientTypeLabel(hubQuery.data.client.clientType)} />
          ) : null}
          {hubQuery.data.client.fiscalProfile?.vatRegime ? (
            <Chip label={`IVA: ${hubQuery.data.client.fiscalProfile.vatRegime}`} />
          ) : null}
          {hubQuery.data.client.fiscalProfile?.irsFramework ? (
            <Chip label={hubQuery.data.client.fiscalProfile.irsFramework} />
          ) : null}
          {hubQuery.data.client.fiscalProfile?.identification?.spouse ? (
            <Chip label="Agregado com cônjuge" tone="brand" />
          ) : null}
          {hubQuery.data.client.fiscalProfile?.socialSecurity?.oneYearExemption ? (
            <Chip label="SS: isenção 1.º ano?" tone="amber" />
          ) : null}
          {hubQuery.data.counts?.obligationsOverdue ? (
            <Chip
              label={`${hubQuery.data.counts.obligationsOverdue} obrigação(ões) em atraso`}
              tone="rose"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function Chip({
  label,
  icon: Icon,
  tone,
}: {
  label: string
  icon?: typeof User
  tone?: 'brand' | 'amber' | 'rose'
}) {
  return (
    <span className={cn('cb-calc-client-chip', tone && `cb-calc-client-chip--${tone}`)}>
      {Icon ? <Icon className="h-3 w-3 shrink-0" aria-hidden /> : null}
      {label}
    </span>
  )
}

function clientTypeLabel(type: string) {
  if (type === 'COMPANY') return 'Empresa'
  if (type === 'SELF_EMPLOYED') return 'Independente'
  if (type === 'INDIVIDUAL') return 'Particular'
  return type
}
