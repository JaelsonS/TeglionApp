import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronsUpDown, History, Loader2, Plus, Search } from 'lucide-react'

import { CAE_OPTIONS } from '@/features/firm/components/companyCreateConstants'
import { contabilFirmApi } from '@/infrastructure/api'
import { Button } from '@/shared/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/shared/components/ui/command'
import { Label } from '@/shared/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { cn } from '@/shared/lib/utils'

const CAE_HISTORY_KEY = ['firm', 'cae-history'] as const

function normalize(value: string) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
}

type CaeComboboxProps = {
  value: string
  onChange: (value: string) => void
  /** Called after a value is confirmed (select / Enter / blur commit). */
  onCommit?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
  /** Persist into firm history when committing a non-empty value. Default true. */
  remember?: boolean
}

export function CaeCombobox({
  value,
  onChange,
  onCommit,
  placeholder = 'Pesquisar ou escrever CAE…',
  disabled = false,
  id,
  className,
  remember = true,
}: CaeComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(normalize(query)), 180)
    return () => window.clearTimeout(t)
  }, [query])

  const historyQuery = useQuery({
    queryKey: CAE_HISTORY_KEY,
    queryFn: () => contabilFirmApi.listCaeHistory(),
    staleTime: 60_000,
  })

  const catalogQuery = useQuery({
    queryKey: ['firm', 'cae-search', debouncedQuery],
    queryFn: () => contabilFirmApi.searchCae(debouncedQuery),
    enabled: open && debouncedQuery.length >= 1,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })

  const rememberMutation = useMutation({
    mutationFn: (cae: string) => contabilFirmApi.rememberCae(cae),
    onSuccess: (data) => {
      queryClient.setQueryData(CAE_HISTORY_KEY, data)
    },
  })

  const firmHistory = historyQuery.data?.items || []
  const presetOptions = useMemo(() => [...CAE_OPTIONS], [])

  const filteredHistory = useMemo(() => {
    const q = normalize(query).toLowerCase()
    if (!q) return firmHistory
    return firmHistory.filter((item) => item.toLowerCase().includes(q))
  }, [firmHistory, query])

  const catalogItems = useMemo(() => {
    const items = catalogQuery.data?.items || []
    const historySet = new Set(firmHistory.map((item) => item.toLowerCase()))
    return items.filter((item) => !historySet.has(item.value.toLowerCase()))
  }, [catalogQuery.data?.items, firmHistory])

  const filteredPresets = useMemo(() => {
    if (debouncedQuery.length >= 1) return []
    const historySet = new Set(firmHistory.map((item) => item.toLowerCase()))
    return presetOptions.filter((item) => !historySet.has(item.toLowerCase()))
  }, [debouncedQuery, firmHistory, presetOptions])

  const normalizedQuery = normalize(query)
  const exactMatch = useMemo(() => {
    if (!normalizedQuery) return false
    const catalogValues = (catalogQuery.data?.items || []).map((i) => i.value)
    const all = [...firmHistory, ...presetOptions, ...catalogValues]
    return all.some((item) => item.toLowerCase() === normalizedQuery.toLowerCase())
  }, [catalogQuery.data?.items, firmHistory, normalizedQuery, presetOptions])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setDebouncedQuery('')
    }
  }, [open])

  function commit(nextRaw: string) {
    const next = normalize(nextRaw)
    onChange(next)
    onCommit?.(next)
    if (remember && next) {
      rememberMutation.mutate(next)
    }
    setOpen(false)
    setQuery('')
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      const typed = normalize(query)
      if (typed && typed.toLowerCase() !== normalize(value).toLowerCase()) {
        commit(typed)
        return
      }
    }
    setOpen(nextOpen)
  }

  const searching = open && debouncedQuery.length >= 1 && catalogQuery.isFetching

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'cb-field-control h-auto min-h-9 w-full justify-between gap-2 px-3 py-2 text-left font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate">{value || placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] overflow-hidden p-0"
        align="start"
        onWheel={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false} className="flex max-h-[min(22rem,70vh)] flex-col overflow-hidden">
          <CommandInput
            placeholder="Ex.: 6201 ou programação…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[min(18rem,55vh)] flex-1 overscroll-contain">
            <CommandEmpty>
              {searching ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> A pesquisar CAE…
                </span>
              ) : normalizedQuery ? (
                'Prima «Adicionar» abaixo ou feche para guardar o texto.'
              ) : (
                'Escreva o código ou a actividade (ex.: padaria).'
              )}
            </CommandEmpty>

            {filteredHistory.length > 0 ? (
              <CommandGroup heading="Usados no escritório" className="overflow-visible">
                {filteredHistory.map((item) => (
                  <CommandItem
                    key={`hist-${item}`}
                    value={item}
                    onSelect={() => commit(item)}
                    className="items-start"
                  >
                    <History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 whitespace-normal break-words">{item}</span>
                    {normalize(value).toLowerCase() === item.toLowerCase() ? (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {filteredHistory.length > 0 && (catalogItems.length > 0 || filteredPresets.length > 0) ? (
              <CommandSeparator />
            ) : null}

            {catalogItems.length > 0 ? (
              <CommandGroup heading="Catálogo CAE (INE)" className="overflow-visible">
                {catalogItems.map((item) => (
                  <CommandItem
                    key={`cae-${item.code}-${item.value}`}
                    value={item.value}
                    onSelect={() => commit(item.value)}
                    className="items-start"
                  >
                    <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 whitespace-normal break-words">{item.value}</span>
                    {normalize(value).toLowerCase() === item.value.toLowerCase() ? (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {filteredPresets.length > 0 ? (
              <CommandGroup heading="Frequentes" className="overflow-visible">
                {filteredPresets.map((item) => (
                  <CommandItem
                    key={`preset-${item}`}
                    value={item}
                    onSelect={() => commit(item)}
                    className="items-start"
                  >
                    <span className="min-w-0 flex-1 whitespace-normal break-words pl-5">{item}</span>
                    {normalize(value).toLowerCase() === item.toLowerCase() ? (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {normalizedQuery && !exactMatch ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem value={`add-${normalizedQuery}`} onSelect={() => commit(normalizedQuery)}>
                    <Plus className="h-3.5 w-3.5 shrink-0 text-brand" />
                    <span className="min-w-0 flex-1">
                      Adicionar <span className="font-medium">«{normalizedQuery}»</span>
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type CaeComboboxFieldProps = {
  label: string
  value: string
  onSave: (value: string) => void
  saving?: boolean
  placeholder?: string
  className?: string
}

/** Inline field for client hub — searchable CAE with firm history. */
export function CaeComboboxField({
  label,
  value,
  onSave,
  saving = false,
  placeholder,
  className,
}: CaeComboboxFieldProps) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-label="A guardar" />
        ) : null}
      </div>
      <CaeCombobox
        value={draft}
        placeholder={placeholder || 'Pesquisar ou escrever CAE…'}
        onChange={setDraft}
        onCommit={(next) => {
          if (next !== value) onSave(next)
        }}
      />
    </div>
  )
}
