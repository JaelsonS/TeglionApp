import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import {
  Check,
  ChevronDown,
  Layers,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command'
import { Input } from '@/shared/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { EuroInput, ProfileSectionCard } from '@/shared/design-system'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import type { AccountingService } from '@/shared/types/contabil'
import { cn } from '@/shared/lib/utils'

type FilterMode = 'all' | 'active' | 'inactive'

type Props = {
  services: AccountingService[]
  onReload: () => void | Promise<void>
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}

export function AgendaServicesCatalogPanel({ services, onReload }: Props) {
  const [filter, setFilter] = useState<FilterMode>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkPrice, setBulkPrice] = useState<number | ''>('')
  const [bulkDuration, setBulkDuration] = useState<number | ''>('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerKeys, setPickerKeys] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<Record<string, Partial<AccountingService>>>({})

  const inactiveCatalog = useMemo(
    () => services.filter((s) => s.isActive === false),
    [services],
  )

  const filtered = useMemo(() => {
    let list = services
    if (filter === 'active') list = list.filter((s) => s.isActive !== false)
    if (filter === 'inactive') list = list.filter((s) => s.isActive === false)
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.catalogKey || '').toLowerCase().includes(q),
    )
  }, [services, filter, search])

  const ensureCatalog = useCallback(async () => {
    if (services.length > 0) return
    setBusy(true)
    try {
      await contabilAccountingServicesApi.seedCatalog()
      await onReload()
      toast.success('Catálogo de consultorias carregado — active os serviços que o escritório presta')
    } catch (err) {
      toast.error('Erro ao carregar catálogo', { description: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }, [services.length, onReload])

  useEffect(() => {
    void ensureCatalog()
  }, [ensureCatalog])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllVisible = () => {
    const ids = filtered.map((s) => s.id)
    const allSelected = ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (allSelected) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }

  const runBulk = async (patch: Record<string, unknown>) => {
    const ids = [...selected]
    if (!ids.length) {
      toast.error('Seleccione um ou mais serviços')
      return
    }
    setBusy(true)
    try {
      await contabilAccountingServicesApi.bulkPatch({ ids, patch })
      toast.success('Serviços actualizados')
      setSelected(new Set())
      setBulkPrice('')
      setBulkDuration('')
      await onReload()
    } catch (err) {
      toast.error('Erro na actualização em massa', { description: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const saveRow = async (s: AccountingService) => {
    const draft = editing[s.id]
    if (!draft) return
    setBusy(true)
    try {
      await contabilAccountingServicesApi.patch(s.id, {
        name: draft.name ?? s.name,
        description: draft.description ?? s.description,
        durationMinutes: draft.durationMinutes ?? s.durationMinutes,
        priceEuros: (draft.priceCents ?? s.priceCents) / 100,
        isActive: draft.isActive ?? s.isActive,
      })
      setEditing((prev) => {
        const next = { ...prev }
        delete next[s.id]
        return next
      })
      toast.success('Serviço guardado')
      await onReload()
    } catch (err) {
      toast.error('Erro ao guardar', { description: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const activatePicker = async () => {
    const keys = [...pickerKeys]
    if (!keys.length) {
      toast.error('Seleccione serviços do catálogo')
      return
    }
    setBusy(true)
    try {
      await contabilAccountingServicesApi.activateCatalog(keys)
      toast.success(`${keys.length} serviço(s) activado(s) no portal`)
      setPickerKeys(new Set())
      setPickerOpen(false)
      await onReload()
    } catch (err) {
      toast.error('Erro ao activar', { description: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const patchEditing = (id: string, patch: Partial<AccountingService>) => {
    setEditing((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }))
  }

  return (
    <ProfileSectionCard
      title="Catálogo de consultorias"
      description="Active apenas o que o escritório presta. O cliente vê só serviços activos ao agendar no portal."
      className="lg:col-span-2"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="rounded-full pl-9"
            placeholder="Filtrar por nome ou tema…"
            value={search}
            onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-full border border-border/50 bg-muted/20 p-1">
          {(
            [
              ['all', 'Todos'],
              ['active', 'Activos'],
              ['inactive', 'Inactivos'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                filter === id ? 'bg-brand text-primary-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              Activar do catálogo
              <ChevronDown className="ml-1 h-4 w-4 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(100vw-2rem,420px)] p-0" align="end">
            <Command>
              <CommandInput placeholder="Pesquisar consultoria…" />
              <CommandList>
                <CommandEmpty>Nenhum serviço inactivo no catálogo.</CommandEmpty>
                <CommandGroup heading="Disponíveis para activar">
                  {inactiveCatalog.map((s) => (
                    <CommandItem
                      key={s.id}
                      value={`${s.name} ${s.description || ''}`}
                      onSelect={() => {
                        if (!s.catalogKey) return
                        setPickerKeys((prev) => {
                          const next = new Set(prev)
                          if (next.has(s.catalogKey!)) next.delete(s.catalogKey!)
                          else next.add(s.catalogKey!)
                          return next
                        })
                      }}
                    >
                      <Checkbox
                        checked={s.catalogKey ? pickerKeys.has(s.catalogKey) : false}
                        className="mr-2"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{s.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {s.durationMinutes} min · {formatPrice(s.priceCents)}
                        </span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            <div className="border-t border-border/50 p-3">
              <Button
                type="button"
                className="cb-btn-primary w-full rounded-full"
                disabled={busy || pickerKeys.size === 0}
                onClick={() => void activatePicker()}
              >
                Activar seleccionados ({pickerKeys.size})
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {selected.size > 0 ? (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-brand/20 bg-brand/[0.04] p-4">
          <p className="w-full text-xs font-semibold text-foreground">{selected.size} seleccionado(s)</p>
          <label className="space-y-1">
            <span className="text-caption font-medium text-muted-foreground">Preço (€)</span>
            <EuroInput
              value={bulkPrice === '' ? 0 : bulkPrice}
              onChange={(v) => setBulkPrice(v)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-caption font-medium text-muted-foreground">Duração (min)</span>
            <Input
              type="number"
              min={15}
              className="w-24 rounded-xl"
              value={bulkDuration === '' ? '' : bulkDuration}
              onChange={(e: FormChangeEvent) => setBulkDuration(e.target.value ? Number(e.target.value) : '')}
            />
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={() => {
              const patch: Record<string, unknown> = {}
              if (bulkPrice !== '') patch.priceEuros = bulkPrice
              if (bulkDuration !== '') patch.durationMinutes = bulkDuration
              if (Object.keys(patch).length) void runBulk(patch)
            }}
          >
            Aplicar preço/duração
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            disabled={busy}
            onClick={() => void runBulk({ isActive: true })}
          >
            <Power className="mr-1 h-3.5 w-3.5" />
            Activar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={() => void runBulk({ isActive: false })}
          >
            <PowerOff className="mr-1 h-3.5 w-3.5" />
            Desactivar
          </Button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 py-10 text-center">
          <Layers className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">Nenhum serviço neste filtro.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/50">
          <div className="grid grid-cols-[auto_1fr_auto] gap-2 border-b border-border/40 bg-muted/30 px-3 py-2 text-caption font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[auto_1fr_repeat(3,auto)_auto]">
            <button type="button" onClick={toggleAllVisible} className="text-left">
              <Checkbox checked={filtered.length > 0 && filtered.every((s) => selected.has(s.id))} />
            </button>
            <span>Serviço</span>
            <span className="hidden sm:block">Duração</span>
            <span className="hidden sm:block">Preço</span>
            <span className="hidden sm:block">Portal</span>
            <span />
          </div>
          <ul className="divide-y divide-border/40">
            {filtered.map((s) => {
              const draft = editing[s.id]
              const active = draft?.isActive ?? s.isActive !== false
              const name = draft?.name ?? s.name
              const duration = draft?.durationMinutes ?? s.durationMinutes
              const priceCents = draft?.priceCents ?? s.priceCents
              const isDirty = Boolean(draft)

              return (
                <li
                  key={s.id}
                  className={cn(
                    'grid grid-cols-[auto_1fr_auto] items-start gap-2 px-3 py-3 sm:grid-cols-[auto_1fr_repeat(3,auto)_auto]',
                    active && 'bg-emerald-50/30',
                  )}
                >
                  <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} />
                  <div className="min-w-0 space-y-1">
                    <Input
                      className="h-9 rounded-lg text-sm font-medium"
                      value={name}
                      onChange={(e: FormChangeEvent) => patchEditing(s.id, { name: e.target.value })}
                    />
                    {s.description ? (
                      <p className="line-clamp-2 cb-text-caption">{s.description}</p>
                    ) : null}
                  </div>
                  <Input
                    type="number"
                    min={15}
                    className="hidden h-9 w-20 rounded-lg sm:block"
                    value={duration}
                    onChange={(e: FormChangeEvent) =>
                      patchEditing(s.id, { durationMinutes: Number(e.target.value) || s.durationMinutes })
                    }
                  />
                  <div className="hidden w-28 sm:block">
                    <EuroInput
                      value={priceCents / 100}
                      onChange={(v) => patchEditing(s.id, { priceCents: Math.round(v * 100) })}
                    />
                  </div>
                  <button
                    type="button"
                    className={cn(
                      'hidden rounded-full px-2.5 py-1 text-caption font-bold uppercase sm:block',
                      active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-muted text-muted-foreground',
                    )}
                    onClick={() => patchEditing(s.id, { isActive: !active })}
                  >
                    {active ? 'Activo' : 'Inactivo'}
                  </button>
                  <Button
                    type="button"
                    size="icon"
                    variant={isDirty ? 'default' : 'ghost'}
                    className="h-9 w-9 shrink-0 rounded-full"
                    disabled={busy || !isDirty}
                    onClick={() => void saveRow(s)}
                  >
                    {isDirty ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4 opacity-40" />}
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </ProfileSectionCard>
  )
}
