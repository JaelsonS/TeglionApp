import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronsUpDown, History, Loader2, Plus } from 'lucide-react'

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
  const queryClient = useQueryClient()

  const historyQuery = useQuery({
    queryKey: CAE_HISTORY_KEY,
    queryFn: () => contabilFirmApi.listCaeHistory(),
    staleTime: 60_000,
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

  const filteredPresets = useMemo(() => {
    const q = normalize(query).toLowerCase()
    const historySet = new Set(firmHistory.map((item) => item.toLowerCase()))
    const base = presetOptions.filter((item) => !historySet.has(item.toLowerCase()))
    if (!q) return base
    return base.filter((item) => item.toLowerCase().includes(q))
  }, [firmHistory, presetOptions, query])

  const normalizedQuery = normalize(query)
  const exactMatch = useMemo(() => {
    if (!normalizedQuery) return false
    const all = [...firmHistory, ...presetOptions]
    return all.some((item) => item.toLowerCase() === normalizedQuery.toLowerCase())
  }, [firmHistory, normalizedQuery, presetOptions])

  useEffect(() => {
    if (!open) setQuery('')
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Filtrar por código ou descrição…"
            value={query}
            onValueChange={setQuery}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && normalizedQuery) {
                e.preventDefault()
                commit(normalizedQuery)
              }
            }}
          />
          <CommandList>
            <CommandEmpty>Sem resultados. Escreva e prima Enter para adicionar.</CommandEmpty>

            {filteredHistory.length > 0 ? (
              <CommandGroup heading="Usados no escritório">
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

            {filteredHistory.length > 0 && filteredPresets.length > 0 ? <CommandSeparator /> : null}

            {filteredPresets.length > 0 ? (
              <CommandGroup heading="Sugestões">
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
