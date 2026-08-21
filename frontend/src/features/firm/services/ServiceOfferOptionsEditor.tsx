import type { FormChangeEvent } from '@/shared/types/react-events'
import { useMemo, useState } from 'react'
import { GripVertical, Plus, Search, Trash2 } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import type { AccountingService, AccountingServiceOptionSummary } from '@/shared/types/contabil'
import { cn } from '@/shared/lib/utils'

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}

/**
 * Oferta comercial: escolher serviços reais como opções do cliente.
 * Pesquisa + lista — evita dropdown gigante. Sem hierarquia recursiva.
 */
export function ServiceOfferOptionsEditor({
  currentServiceId,
  allServices,
  value,
  onChange,
}: {
  currentServiceId?: string | null
  allServices: AccountingService[]
  value: string[]
  onChange: (ids: string[]) => void
}) {
  const [query, setQuery] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  const selected = useMemo(() => {
    const byId = new Map(allServices.map((s) => [s.id, s]))
    return value
      .map((id) => byId.get(id))
      .filter(Boolean) as AccountingService[]
  }, [allServices, value])

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allServices.filter((s) => {
      if (currentServiceId && s.id === currentServiceId) return false
      if (value.includes(s.id)) return false
      // Não oferecer serviços que já são ofertas (têm opções) — profundidade 1.
      if ((s.optionServiceIds || []).length > 0 || (s.options || []).length > 0) return false
      if (s.isActive === false) return false
      if (!q) return true
      return s.name.toLowerCase().includes(q)
    })
  }, [allServices, currentServiceId, value, query])

  function add(id: string) {
    if (!id || value.includes(id)) return
    onChange([...value, id])
    setQuery('')
    setPickerOpen(false)
  }

  function remove(id: string) {
    onChange(value.filter((x) => x !== id))
  }

  function move(id: string, dir: -1 | 1) {
    const idx = value.indexOf(id)
    if (idx < 0) return
    const next = [...value]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    onChange(next)
  }

  return (
    <div className="space-y-3" data-testid="service-offer-options-editor">
      <div>
        <p className="text-sm font-medium text-foreground">Opções para o cliente</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Escolha os serviços que serão apresentados como opções dentro desta oferta. O cliente escolhe
          uma modalidade; preço, duração e agendamento vêm do serviço real seleccionado.
        </p>
      </div>

      {selected.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 bg-muted/10 px-3 py-3 text-xs text-muted-foreground">
          Nenhuma opção — este serviço funciona como oferta simples (comportamento actual).
        </p>
      ) : (
        <ul className="space-y-2">
          {selected.map((s, index) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-background/80 px-3 py-2"
            >
              <span className="text-muted-foreground" aria-hidden>
                <GripVertical className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(s.priceCents || 0)} · {s.durationMinutes || 60} min
                  {!s.isPubliclyListed ? ' · não publicado' : ''}
                  {s.isActive === false ? ' · inactivo' : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={index === 0}
                  onClick={() => move(s.id, -1)}
                  aria-label="Subir"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={index === selected.length - 1}
                  onClick={() => move(s.id, 1)}
                  aria-label="Descer"
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  aria-label={`Remover ${s.name}`}
                  onClick={() => remove(s.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pickerOpen ? (
        <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e: FormChangeEvent) => setQuery(e.target.value)}
              placeholder="Pesquisar serviços do escritório…"
              className="h-9 rounded-lg pl-8"
              autoFocus
            />
          </div>
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
            {candidates.length === 0 ? (
              <li className="px-2 py-3 text-xs text-muted-foreground">
                {query.trim()
                  ? 'Nenhum serviço encontrado.'
                  : 'Não há mais serviços elegíveis (ou já são ofertas com opções).'}
              </li>
            ) : (
              candidates.slice(0, 40).map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-muted/40',
                    )}
                    onClick={() => add(s.id)}
                  >
                    <span className="min-w-0 truncate font-medium">{s.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatPrice(s.priceCents || 0)} · {s.durationMinutes || 60} min
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="mt-2 flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setPickerOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 rounded-full"
          onClick={() => setPickerOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar opção
        </Button>
      )}
    </div>
  )
}

export type { AccountingServiceOptionSummary }
