import type { FormChangeEvent } from '@/shared/types/react-events'
import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Check,
  Clock,
  Copy,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import type { TimeInterval } from '@/shared/types/contabil'
import { cn } from '@/shared/lib/utils'

import { cloneIntervals, dayOverrideKind } from './bookingDateOverrides'

export type DayAvailabilityDraft = {
  mode: 'inherit' | 'closed' | 'custom'
  intervals: TimeInterval[]
}

export type ServiceDayMode = 'inherit' | 'closed' | 'open'

export type ServiceDayDraft = {
  id: string
  name: string
  mode: ServiceDayMode
  intervals: TimeInterval[]
  inheritedLabel: string
}

function draftFromExisting(
  existing: TimeInterval[] | undefined,
  hasOverride: boolean,
  defaultInterval: TimeInterval,
): DayAvailabilityDraft {
  if (!hasOverride) {
    return { mode: 'inherit', intervals: cloneIntervals(existing?.length ? existing : [defaultInterval]) }
  }
  if (!existing || existing.length === 0) {
    return { mode: 'closed', intervals: [defaultInterval] }
  }
  return { mode: 'custom', intervals: cloneIntervals(existing) }
}

/**
 * Dialog do dia: excepção do horário geral + selecção múltipla de serviços
 * (oferecer / herdar / horário próprio / limpar / renomear).
 */
export function AgendaDayAvailabilityDialog({
  open,
  onOpenChange,
  date,
  hasOverride,
  overrideIntervals,
  weekdayIntervals,
  defaultInterval,
  serviceDrafts,
  onServiceDraftsChange,
  onRenameService,
  onSave,
  onCopyFromDate,
  saving = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string | null
  hasOverride: boolean
  overrideIntervals?: TimeInterval[]
  weekdayIntervals: TimeInterval[]
  defaultInterval: TimeInterval
  serviceDrafts?: ServiceDayDraft[]
  onServiceDraftsChange?: (next: ServiceDayDraft[]) => void
  onRenameService?: (serviceId: string, name: string) => Promise<void> | void
  onSave: (draft: DayAvailabilityDraft) => void | Promise<void>
  onCopyFromDate?: (fromDate: string) => void
  saving?: boolean
}) {
  const [draft, setDraft] = useState<DayAvailabilityDraft>({
    mode: 'inherit',
    intervals: [defaultInterval],
  })
  const [copyFrom, setCopyFrom] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameSaving, setRenameSaving] = useState(false)

  useEffect(() => {
    if (!open || !date) return
    setDraft(draftFromExisting(overrideIntervals, hasOverride, defaultInterval))
    setCopyFrom('')
    setRenamingId(null)
    setRenameValue('')
  }, [open, date, hasOverride, overrideIntervals, defaultInterval])

  if (!date) return null

  const titleDate = (() => {
    const [y, m, d] = date.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  })()

  const kind = hasOverride
    ? dayOverrideKind(date, { [date]: overrideIntervals || [] })
    : 'none'

  const offeredCount = (serviceDrafts || []).filter((s) => s.mode !== 'closed').length

  function updateInterval(index: number, patch: Partial<TimeInterval>) {
    setDraft((prev) => {
      const intervals = [...prev.intervals]
      intervals[index] = { ...intervals[index], ...patch }
      return { ...prev, intervals }
    })
  }

  function addInterval() {
    setDraft((prev) => ({
      ...prev,
      mode: 'custom',
      intervals: [...prev.intervals, { start: '14:00', end: '17:00' }],
    }))
  }

  function removeInterval(index: number) {
    setDraft((prev) => {
      const intervals = prev.intervals.filter((_, i) => i !== index)
      return {
        ...prev,
        intervals: intervals.length ? intervals : [{ ...defaultInterval }],
      }
    })
  }

  function patchService(id: string, patch: Partial<ServiceDayDraft>) {
    if (!onServiceDraftsChange || !serviceDrafts) return
    onServiceDraftsChange(
      serviceDrafts.map((s) => {
        if (s.id !== id) return s
        const next = { ...s, ...patch }
        if (patch.mode === 'open' && !next.intervals.length) {
          next.intervals = cloneIntervals(
            weekdayIntervals.length ? weekdayIntervals : [defaultInterval],
          )
        }
        return next
      }),
    )
  }

  function setOffered(id: string, offered: boolean) {
    patchService(id, { mode: offered ? 'inherit' : 'closed' })
  }

  function selectAllServices(offered: boolean) {
    if (!onServiceDraftsChange || !serviceDrafts) return
    onServiceDraftsChange(
      serviceDrafts.map((s) => ({
        ...s,
        mode: offered ? (s.mode === 'closed' ? 'inherit' : s.mode) : 'closed',
      })),
    )
  }

  async function commitRename(id: string) {
    const next = renameValue.trim()
    if (!next || !onRenameService) {
      setRenamingId(null)
      return
    }
    setRenameSaving(true)
    try {
      await onRenameService(id, next)
      patchService(id, { name: next })
      setRenamingId(null)
    } finally {
      setRenameSaving(false)
    }
  }

  async function handleSave() {
    if (draft.mode === 'custom' && draft.intervals.length === 0) return
    await onSave(draft)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        data-testid="agenda-day-availability-dialog"
      >
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="capitalize">{titleDate}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {kind === 'none'
              ? 'Sem excepção — usa o horário semanal'
              : kind === 'closed'
                ? 'Excepção activa: dia fechado'
                : 'Excepção activa: horário especial'}
          </p>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Escolher configuração para este dia
            </p>
            <div className="grid gap-2" role="radiogroup" aria-label="Modo do dia">
              {(
                [
                  {
                    mode: 'inherit' as const,
                    label: 'Usar horário semanal',
                    hint: 'Aplica o horário definido para este dia da semana.',
                    Icon: CalendarDays,
                  },
                  {
                    mode: 'closed' as const,
                    label: 'Dia fechado',
                    hint: 'Não há disponibilidade para marcações.',
                    Icon: Lock,
                  },
                  {
                    mode: 'custom' as const,
                    label: 'Horário especial',
                    hint: 'Defina um horário diferente apenas para este dia.',
                    Icon: Clock,
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.mode}
                  type="button"
                  role="radio"
                  aria-checked={draft.mode === opt.mode}
                  className={cn(
                    'cb-agenda-day-mode-card',
                    draft.mode === opt.mode
                      ? 'cb-agenda-day-mode-card-on'
                      : 'cb-agenda-day-mode-card-off',
                  )}
                  onClick={() =>
                    setDraft((prev) => ({
                      mode: opt.mode,
                      intervals:
                        opt.mode === 'custom' && prev.intervals.length === 0
                          ? [{ ...defaultInterval }]
                          : prev.intervals.length
                            ? prev.intervals
                            : [{ ...defaultInterval }],
                    }))
                  }
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                      draft.mode === opt.mode
                        ? 'border-[hsl(222_47%_16%)] bg-[hsl(222_47%_16%)]'
                        : 'border-border',
                    )}
                    aria-hidden
                  >
                    {draft.mode === opt.mode ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    ) : null}
                  </span>
                  <opt.Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{opt.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{opt.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {draft.mode === 'custom' ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Horário especial
              </p>
              <ul className="space-y-2">
                {draft.intervals.map((iv, idx) => (
                  <li key={`${idx}-${iv.start}`} className="flex flex-wrap items-end gap-2">
                    <div>
                      <Label className="text-[11px]">Das</Label>
                      <Input
                        type="time"
                        className="mt-1 h-9 w-[7.5rem] rounded-lg"
                        value={iv.start}
                        onChange={(e: FormChangeEvent) => updateInterval(idx, { start: e.target.value })}
                      />
                    </div>
                    <span className="pb-2 text-xs text-muted-foreground">às</span>
                    <div>
                      <Label className="text-[11px]">às</Label>
                      <Input
                        type="time"
                        className="mt-1 h-9 w-[7.5rem] rounded-lg"
                        value={iv.end}
                        onChange={(e: FormChangeEvent) => updateInterval(idx, { end: e.target.value })}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive"
                      aria-label="Remover intervalo"
                      onClick={() => removeInterval(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1 rounded-lg text-xs"
                onClick={addInterval}
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar intervalo
              </Button>
            </div>
          ) : null}

          {onCopyFromDate ? (
            <div className="rounded-xl border border-border/50 bg-muted/10 p-3">
              <Label htmlFor="copy-from-day" className="text-xs">
                Copiar configuração de outro dia
              </Label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Input
                  id="copy-from-day"
                  type="date"
                  className="h-9 w-40 rounded-lg"
                  value={copyFrom}
                  onChange={(e: FormChangeEvent) => setCopyFrom(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1"
                  disabled={!copyFrom || copyFrom === date || saving}
                  onClick={() => {
                    if (!copyFrom) return
                    onCopyFromDate(copyFrom)
                    onOpenChange(false)
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </Button>
              </div>
            </div>
          ) : null}

          {serviceDrafts && serviceDrafts.length > 0 ? (
            <div data-testid="agenda-day-services-editor">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Serviços neste dia
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Escolha quais serviços estão disponíveis. Pode editar horário, limpar excepção ou
                    renomear.
                  </p>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  {offeredCount} de {serviceDrafts.length} seleccionado(s)
                </p>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-lg text-xs"
                  onClick={() => selectAllServices(true)}
                >
                  Seleccionar todos
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-lg text-xs"
                  onClick={() => selectAllServices(false)}
                >
                  Limpar selecção
                </Button>
              </div>

              <ul className="mt-3 space-y-2">
                {serviceDrafts.map((s) => {
                  const offered = s.mode !== 'closed'
                  const editingName = renamingId === s.id
                  return (
                    <li
                      key={s.id}
                      className={cn(
                        'rounded-xl border px-3 py-2.5 transition',
                        offered
                          ? 'border-sky-200 bg-sky-50/40'
                          : 'border-border/50 bg-muted/5 opacity-80',
                      )}
                      data-testid={`agenda-day-service-${s.id}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <Checkbox
                          className="mt-1"
                          checked={offered}
                          onCheckedChange={(checked: boolean | 'indeterminate') =>
                            setOffered(s.id, Boolean(checked))
                          }
                          aria-label={`Oferecer ${s.name} neste dia`}
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {editingName ? (
                              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                                <Input
                                  value={renameValue}
                                  onChange={(e: FormChangeEvent) => setRenameValue(e.target.value)}
                                  className="h-8 max-w-xs rounded-lg text-sm"
                                  aria-label="Novo nome do serviço"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') void commitRename(s.id)
                                    if (e.key === 'Escape') setRenamingId(null)
                                  }}
                                />
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  disabled={renameSaving}
                                  aria-label="Confirmar nome"
                                  onClick={() => void commitRename(s.id)}
                                >
                                  {renameSaving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  aria-label="Cancelar renomear"
                                  onClick={() => setRenamingId(null)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-foreground">{s.name}</p>
                                {onRenameService ? (
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-muted-foreground"
                                    aria-label={`Renomear ${s.name}`}
                                    onClick={() => {
                                      setRenamingId(s.id)
                                      setRenameValue(s.name)
                                    }}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                ) : null}
                              </>
                            )}
                          </div>

                          {offered ? (
                            <>
                              <div
                                className="inline-flex w-fit rounded-lg border border-border/60 bg-background p-0.5"
                                role="group"
                                aria-label={`Disponibilidade de ${s.name}`}
                              >
                                {(
                                  [
                                    { mode: 'inherit' as const, label: 'Herdar' },
                                    { mode: 'open' as const, label: 'Horário próprio' },
                                  ] as const
                                ).map((opt) => (
                                  <button
                                    key={opt.mode}
                                    type="button"
                                    className={cn(
                                      'rounded-md px-2.5 py-1 text-[11px] font-semibold transition',
                                      s.mode === opt.mode
                                        ? 'bg-[hsl(222_47%_16%)] text-white'
                                        : 'text-muted-foreground hover:bg-muted/40',
                                    )}
                                    aria-pressed={s.mode === opt.mode}
                                    onClick={() => patchService(s.id, { mode: opt.mode })}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>

                              {s.mode === 'inherit' ? (
                                <p className="text-[11px] text-muted-foreground">{s.inheritedLabel}</p>
                              ) : null}

                              {s.mode === 'open' ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  {(s.intervals.length ? s.intervals : [defaultInterval]).map(
                                    (iv, idx) => (
                                      <div
                                        key={`${s.id}-${idx}`}
                                        className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-card px-1.5 py-1"
                                      >
                                        <Input
                                          type="time"
                                          className="h-8 w-[6.5rem] rounded-md border-0 bg-transparent text-xs shadow-none"
                                          value={iv.start}
                                          aria-label={`${s.name} início ${idx + 1}`}
                                          onChange={(e: FormChangeEvent) => {
                                            const intervals = cloneIntervals(
                                              s.intervals.length ? s.intervals : [defaultInterval],
                                            )
                                            intervals[idx] = {
                                              ...intervals[idx],
                                              start: e.target.value,
                                            }
                                            patchService(s.id, { intervals })
                                          }}
                                        />
                                        <span className="text-xs text-muted-foreground">–</span>
                                        <Input
                                          type="time"
                                          className="h-8 w-[6.5rem] rounded-md border-0 bg-transparent text-xs shadow-none"
                                          value={iv.end}
                                          aria-label={`${s.name} fim ${idx + 1}`}
                                          onChange={(e: FormChangeEvent) => {
                                            const intervals = cloneIntervals(
                                              s.intervals.length ? s.intervals : [defaultInterval],
                                            )
                                            intervals[idx] = {
                                              ...intervals[idx],
                                              end: e.target.value,
                                            }
                                            patchService(s.id, { intervals })
                                          }}
                                        />
                                        {(s.intervals.length || 1) > 1 ? (
                                          <button
                                            type="button"
                                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-rose-50 hover:text-rose-700"
                                            aria-label={`Remover intervalo ${idx + 1}`}
                                            onClick={() => {
                                              const intervals = (
                                                s.intervals.length ? s.intervals : [defaultInterval]
                                              ).filter((_, i) => i !== idx)
                                              patchService(s.id, {
                                                intervals: intervals.length
                                                  ? intervals
                                                  : [{ ...defaultInterval }],
                                              })
                                            }}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        ) : null}
                                      </div>
                                    ),
                                  )}
                                  <button
                                    type="button"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-border/70 text-muted-foreground hover:border-sky-400 hover:bg-sky-50"
                                    aria-label={`Adicionar intervalo a ${s.name}`}
                                    onClick={() => {
                                      const base = s.intervals.length
                                        ? s.intervals
                                        : [defaultInterval]
                                      patchService(s.id, {
                                        intervals: [...base, { start: '14:00', end: '17:00' }],
                                      })
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">
                              Não oferecido neste dia (fechado para marcações).
                            </p>
                          )}
                        </div>

                        {s.mode !== 'inherit' ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-rose-700"
                            aria-label={`Apagar excepção de ${s.name}`}
                            title="Repor para herdar o horário geral"
                            onClick={() => patchService(s.id, { mode: 'inherit' })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-[hsl(222_47%_16%)] hover:bg-[hsl(222_47%_20%)]"
            onClick={() => void handleSave()}
            disabled={saving}
            data-testid="agenda-day-availability-save"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar dia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
