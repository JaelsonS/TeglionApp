import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import {
  Check,
  ChevronDown,
  Copy,
  FileQuestion,
  Globe,
  Layers,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Settings2,
  Trash2,
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
import type {
  AccountingService,
  DocumentRequirement,
  IntakeQuestion,
  IntakeQuestionOption,
  IntakeQuestionType,
} from '@/shared/types/contabil'
import { cn } from '@/shared/lib/utils'

type FilterMode = 'all' | 'active' | 'inactive'

/**
 * ID estável — gerado uma única vez na criação da pergunta/opção, nunca
 * recalculado a partir do label. Editar o texto depois de guardado não pode
 * desalinhar `service_inquiries.answers` já submetidas (ver especificação
 * da sessão, secção E1).
 */
function generateStableId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}${random}`
}

const CHOICE_TYPES: IntakeQuestionType[] = ['single_choice', 'multiple_choice', 'yes_no']

const QUESTION_TYPE_LABELS: Record<IntakeQuestionType, string> = {
  text: 'Texto livre',
  email: 'Email',
  phone: 'Telefone',
  tax_id: 'NIF',
  date: 'Data',
  single_choice: 'Escolha única',
  multiple_choice: 'Escolha múltipla',
  yes_no: 'Sim / Não',
}

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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [advancedDraft, setAdvancedDraft] = useState<Record<string, Partial<AccountingService>>>({})
  const [duplicating, setDuplicating] = useState<string | null>(null)

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

  const patchAdvanced = (id: string, patch: Partial<AccountingService>) => {
    setAdvancedDraft((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }))
  }

  const toggleExpanded = (s: AccountingService) => {
    setExpandedId((prev) => {
      if (prev === s.id) return null
      setAdvancedDraft((draft) => ({
        ...draft,
        [s.id]: draft[s.id] ?? {
          slug: s.slug ?? '',
          isPubliclyListed: s.isPubliclyListed ?? false,
          requiresBooking: s.requiresBooking ?? true,
          documentRequirements: s.documentRequirements ?? [],
          intakeForm: s.intakeForm ?? { questions: [] },
        },
      }))
      return s.id
    })
  }

  const saveAdvanced = async (s: AccountingService) => {
    const draft = advancedDraft[s.id]
    if (!draft) return
    setBusy(true)
    try {
      await contabilAccountingServicesApi.patch(s.id, {
        slug: draft.slug || null,
        isPubliclyListed: draft.isPubliclyListed,
        requiresBooking: draft.requiresBooking,
        documentRequirements: draft.documentRequirements,
        intakeForm: draft.intakeForm,
      })
      toast.success('Serviço actualizado')
      await onReload()
    } catch (err) {
      toast.error('Erro ao guardar', { description: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const duplicateService = async (s: AccountingService) => {
    setDuplicating(s.id)
    try {
      await contabilAccountingServicesApi.duplicate(s.id)
      toast.success(`"${s.name}" duplicado — edite o nome e active quando estiver pronto`)
      await onReload()
    } catch (err) {
      toast.error('Erro ao duplicar', { description: getErrorMessage(err) })
    } finally {
      setDuplicating(null)
    }
  }

  const slugifyTag = (title: string, index: number) => {
    const base = title
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
    return base || `documento_${index + 1}`
  }

  const addRequirement = (id: string) => {
    const current = advancedDraft[id]?.documentRequirements ?? []
    patchAdvanced(id, {
      documentRequirements: [...current, { tag: `documento_${current.length + 1}`, title: '', instructions: '' }],
    })
  }

  const updateRequirement = (id: string, index: number, patch: Partial<DocumentRequirement>) => {
    const current = advancedDraft[id]?.documentRequirements ?? []
    const next = current.map((req, i) => {
      if (i !== index) return req
      const merged = { ...req, ...patch }
      // tag deriva do título automaticamente — é um identificador interno, não editável directamente aqui.
      if (patch.title !== undefined) merged.tag = slugifyTag(merged.title, index)
      return merged
    })
    patchAdvanced(id, { documentRequirements: next })
  }

  const removeRequirement = (id: string, index: number) => {
    const current = advancedDraft[id]?.documentRequirements ?? []
    patchAdvanced(id, { documentRequirements: current.filter((_, i) => i !== index) })
  }

  const addQuestion = (id: string) => {
    const current = advancedDraft[id]?.intakeForm?.questions ?? []
    const next: IntakeQuestion[] = [
      ...current,
      { id: generateStableId('q_'), label: '', type: 'text', required: false },
    ]
    patchAdvanced(id, { intakeForm: { questions: next } })
  }

  const updateQuestion = (id: string, index: number, patch: Partial<IntakeQuestion>) => {
    const current = advancedDraft[id]?.intakeForm?.questions ?? []
    const next = current.map((q, i) => {
      if (i !== index) return q
      const merged: IntakeQuestion = { ...q, ...patch }
      if (patch.type !== undefined) {
        if (CHOICE_TYPES.includes(patch.type)) {
          merged.options =
            patch.type === 'yes_no'
              ? [
                  { id: 'sim', label: 'Sim', documentTags: [] },
                  { id: 'nao', label: 'Não', documentTags: [] },
                ]
              : q.options && q.options.length
                ? q.options
                : [{ id: generateStableId('o_'), label: '', documentTags: [] }]
        } else {
          delete merged.options
        }
      }
      return merged
    })
    patchAdvanced(id, { intakeForm: { questions: next } })
  }

  const removeQuestion = (id: string, index: number) => {
    const current = advancedDraft[id]?.intakeForm?.questions ?? []
    patchAdvanced(id, { intakeForm: { questions: current.filter((_, i) => i !== index) } })
  }

  const addOption = (id: string, qIndex: number) => {
    const current = advancedDraft[id]?.intakeForm?.questions ?? []
    const next = current.map((q, i) =>
      i !== qIndex
        ? q
        : { ...q, options: [...(q.options ?? []), { id: generateStableId('o_'), label: '', documentTags: [] }] },
    )
    patchAdvanced(id, { intakeForm: { questions: next } })
  }

  const updateOption = (id: string, qIndex: number, oIndex: number, patch: Partial<IntakeQuestionOption>) => {
    const current = advancedDraft[id]?.intakeForm?.questions ?? []
    const next = current.map((q, i) => {
      if (i !== qIndex) return q
      const options = (q.options ?? []).map((o, oi) => (oi === oIndex ? { ...o, ...patch } : o))
      return { ...q, options }
    })
    patchAdvanced(id, { intakeForm: { questions: next } })
  }

  const removeOption = (id: string, qIndex: number, oIndex: number) => {
    const current = advancedDraft[id]?.intakeForm?.questions ?? []
    const next = current.map((q, i) =>
      i !== qIndex ? q : { ...q, options: (q.options ?? []).filter((_, oi) => oi !== oIndex) },
    )
    patchAdvanced(id, { intakeForm: { questions: next } })
  }

  const toggleOptionDocumentTag = (id: string, qIndex: number, oIndex: number, tag: string) => {
    const current = advancedDraft[id]?.intakeForm?.questions ?? []
    const next = current.map((q, i) => {
      if (i !== qIndex) return q
      const options = (q.options ?? []).map((o, oi) => {
        if (oi !== oIndex) return o
        const has = o.documentTags.includes(tag)
        return { ...o, documentTags: has ? o.documentTags.filter((t) => t !== tag) : [...o.documentTags, tag] }
      })
      return { ...q, options }
    })
    patchAdvanced(id, { intakeForm: { questions: next } })
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
              const isExpanded = expandedId === s.id
              const adv = advancedDraft[s.id]
              const advDirty = Boolean(adv)
              const requirements = adv?.documentRequirements ?? s.documentRequirements ?? []
              const questions = adv?.intakeForm?.questions ?? s.intakeForm?.questions ?? []

              return (
                <li key={s.id}>
                  <div
                    className={cn(
                      'grid grid-cols-[auto_1fr_auto] items-start gap-2 px-3 py-3 sm:grid-cols-[auto_1fr_repeat(3,auto)_auto_auto]',
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
                      {s.isPubliclyListed ? (
                        <span className="inline-flex items-center gap-1 text-caption text-emerald-700">
                          <Globe className="h-3 w-3" /> Público
                        </span>
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
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-full"
                        disabled={duplicating === s.id}
                        title="Duplicar serviço"
                        onClick={() => void duplicateService(s)}
                      >
                        <Copy className="h-4 w-4 opacity-60" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant={isExpanded ? 'default' : 'ghost'}
                        className="h-9 w-9 rounded-full"
                        title="Definições avançadas (link público, agendamento, documentos)"
                        onClick={() => toggleExpanded(s)}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                  </div>

                  {isExpanded && adv ? (
                    <div className="space-y-4 border-t border-border/40 bg-muted/10 px-4 py-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1">
                          <span className="text-caption font-medium text-muted-foreground">
                            Endereço público (slug)
                          </span>
                          <Input
                            placeholder="ex.: irs-2026"
                            className="h-9 rounded-lg"
                            value={adv.slug ?? ''}
                            onChange={(e: FormChangeEvent) => patchAdvanced(s.id, { slug: e.target.value })}
                          />
                        </label>
                        <div className="flex flex-col justify-end gap-2 sm:flex-row sm:items-center">
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={adv.isPubliclyListed ?? false}
                              onCheckedChange={(checked: boolean | 'indeterminate') =>
                                patchAdvanced(s.id, { isPubliclyListed: Boolean(checked) })
                              }
                            />
                            Aparece na página pública
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={adv.requiresBooking ?? true}
                              onCheckedChange={(checked: boolean | 'indeterminate') =>
                                patchAdvanced(s.id, { requiresBooking: Boolean(checked) })
                              }
                            />
                            Precisa de agendamento
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-caption font-medium text-muted-foreground">
                            Documentos sempre necessários
                          </span>
                          <Button type="button" size="sm" variant="outline" onClick={() => addRequirement(s.id)}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
                          </Button>
                        </div>
                        {requirements.length === 0 ? (
                          <p className="cb-text-caption">Nenhum documento configurado ainda.</p>
                        ) : (
                          <div className="space-y-2">
                            {requirements.map((req, index) => (
                              <div key={index} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/40 p-2">
                                <Input
                                  placeholder="Nome do documento"
                                  className="h-8 min-w-[160px] flex-1 rounded-md text-sm"
                                  value={req.title}
                                  onChange={(e: FormChangeEvent) =>
                                    updateRequirement(s.id, index, { title: e.target.value })
                                  }
                                />
                                <Input
                                  placeholder="Instruções (opcional)"
                                  className="h-8 min-w-[160px] flex-1 rounded-md text-sm"
                                  value={req.instructions ?? ''}
                                  onChange={(e: FormChangeEvent) =>
                                    updateRequirement(s.id, index, { instructions: e.target.value })
                                  }
                                />
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 shrink-0 rounded-full"
                                  onClick={() => removeRequirement(s.id, index)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 opacity-60" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground">
                            <FileQuestion className="h-3.5 w-3.5" /> Formulário de captação
                          </span>
                          <Button type="button" size="sm" variant="outline" onClick={() => addQuestion(s.id)}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar pergunta
                          </Button>
                        </div>
                        {questions.length === 0 ? (
                          <p className="cb-text-caption">
                            Sem perguntas — a página pública pede só nome e email/telefone.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {questions.map((q, qIndex) => (
                              <div key={qIndex} className="space-y-2 rounded-lg border border-border/40 p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Input
                                    placeholder="Pergunta"
                                    className="h-8 min-w-[180px] flex-1 rounded-md text-sm"
                                    value={q.label}
                                    onChange={(e: FormChangeEvent) =>
                                      updateQuestion(s.id, qIndex, { label: e.target.value })
                                    }
                                  />
                                  <select
                                    className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                                    value={q.type}
                                    onChange={(e) =>
                                      updateQuestion(s.id, qIndex, {
                                        type: e.target.value as IntakeQuestionType,
                                      })
                                    }
                                  >
                                    {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                                      <option key={value} value={value}>
                                        {label}
                                      </option>
                                    ))}
                                  </select>
                                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Checkbox
                                      checked={q.required}
                                      onCheckedChange={(checked: boolean | 'indeterminate') =>
                                        updateQuestion(s.id, qIndex, { required: Boolean(checked) })
                                      }
                                    />
                                    Obrigatória
                                  </label>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 shrink-0 rounded-full"
                                    onClick={() => removeQuestion(s.id, qIndex)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 opacity-60" />
                                  </Button>
                                </div>

                                {q.options ? (
                                  <div className="ml-2 space-y-2 border-l-2 border-border/30 pl-3">
                                    {q.options.map((opt, oIndex) => (
                                      <div key={oIndex} className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                          <Input
                                            placeholder="Opção"
                                            className="h-7 min-w-[140px] flex-1 rounded-md text-xs"
                                            value={opt.label}
                                            onChange={(e: FormChangeEvent) =>
                                              updateOption(s.id, qIndex, oIndex, { label: e.target.value })
                                            }
                                          />
                                          {q.type !== 'yes_no' ? (
                                            <Button
                                              type="button"
                                              size="icon"
                                              variant="ghost"
                                              className="h-7 w-7 shrink-0 rounded-full"
                                              onClick={() => removeOption(s.id, qIndex, oIndex)}
                                            >
                                              <Trash2 className="h-3 w-3 opacity-50" />
                                            </Button>
                                          ) : null}
                                        </div>
                                        {requirements.length > 0 ? (
                                          <div className="flex flex-wrap gap-2 pl-1">
                                            {requirements.map((req) => (
                                              <label
                                                key={req.tag}
                                                className="flex items-center gap-1 text-[11px] text-muted-foreground"
                                              >
                                                <Checkbox
                                                  checked={opt.documentTags.includes(req.tag)}
                                                  onCheckedChange={() =>
                                                    toggleOptionDocumentTag(s.id, qIndex, oIndex, req.tag)
                                                  }
                                                />
                                                {req.title || req.tag}
                                              </label>
                                            ))}
                                          </div>
                                        ) : null}
                                      </div>
                                    ))}
                                    {q.type !== 'yes_no' ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 rounded-full text-xs"
                                        onClick={() => addOption(s.id, qIndex)}
                                      >
                                        <Plus className="mr-1 h-3 w-3" /> Adicionar opção
                                      </Button>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy || !advDirty}
                          onClick={() => void saveAdvanced(s)}
                        >
                          Guardar definições avançadas
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </ProfileSectionCard>
  )
}
