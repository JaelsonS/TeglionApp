import type { FormChangeEvent } from '@/shared/types/react-events'
import { Clock, Sparkles } from 'lucide-react'

import { ClientSearchSelect } from '@/features/firm/components/ClientSearchSelect'
import { FormField } from '@/shared/design-system'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import type { AccountingService } from '@/shared/types/contabil'
import type { Client } from '@/shared/types/clients'
import { formatEuro } from '@/shared/utils/contabilLocale'
import { cn } from '@/shared/lib/utils'

type Props = {
  clients: Client[]
  services: AccountingService[]
  clientId: string
  onClientId: (id: string) => void
  selectedServiceId: string
  onServiceId: (id: string) => void
  title: string
  onTitle: (v: string) => void
  scheduledAt: string
  onScheduledAt: (v: string) => void
  notes: string
  onNotes: (v: string) => void
  onSubmit: () => void
  onClose: () => void
  submitting?: boolean
}

export function AgendaCreatePanel(props: Props) {
  const {
    clients,
    services,
    clientId,
    onClientId,
    selectedServiceId,
    onServiceId,
    title,
    onTitle,
    scheduledAt,
    onScheduledAt,
    notes,
    onNotes,
    onSubmit,
    onClose,
    submitting = false,
  } = props

  const activeServices = services.filter((s) => s.isActive !== false)

  return (
    <section className="shrink-0 rounded-2xl border border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.04] shadow-[var(--cb-shadow-elevated)]">
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <div>
            <h3 className="font-display text-base font-semibold">Nova reunião</h3>
            <p className="text-xs text-muted-foreground">Marcação rápida pelo escritório</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="rounded-full" onClick={onClose}>
          Fechar
        </Button>
      </div>

      <div className="space-y-5 p-5">
        <ClientSearchSelect clients={clients} value={clientId} onChange={onClientId} />

        {activeServices.length > 0 ? (
          <div>
            <p className="cb-field-label mb-2">Serviço</p>
            <div className="flex flex-wrap gap-2">
              {activeServices.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onServiceId(s.id)
                    onTitle(s.name)
                  }}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-left text-xs transition',
                    selectedServiceId === s.id
                      ? 'border-primary/40 bg-primary/[0.06] ring-1 ring-primary/15'
                      : 'border-border/50 bg-card hover:bg-muted/30',
                  )}
                >
                  <span className="font-semibold text-foreground">{s.name}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {s.durationMinutes} min · {formatEuro(s.priceCents)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Título">
            <Input className="cb-field-control border-0 shadow-none" value={title} onChange={(e: FormChangeEvent) => onTitle(e.target.value)} />
          </FormField>
          <FormField label="Data e hora">
            <Input
              type="datetime-local"
              className="cb-field-control border-0 shadow-none"
              value={scheduledAt}
              onChange={(e: FormChangeEvent) => onScheduledAt(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Objetivo da reunião" hint="Opcional — visível na ficha da consulta">
          <Input
            className="cb-field-control border-0 shadow-none"
            value={notes}
            onChange={(e: FormChangeEvent) => onNotes(e.target.value)}
            placeholder="Ex.: Fecho de contas trimestral"
          />
        </FormField>

        <Button className="w-full rounded-full sm:w-auto" onClick={onSubmit} disabled={submitting}>
          {submitting ? 'A agendar…' : 'Confirmar reunião'}
        </Button>
      </div>
    </section>
  )
}
