import type { FormChangeEvent } from '@/shared/types/react-events'
import { useEffect, useState } from 'react'
import { CalendarDays, Clock, Copy, Loader2, Lock, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
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
  /** Intervalos quando mode === 'open' */
  intervals: TimeInterval[]
  /** Texto efectivo herdado (só UI). */
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

function serviceStatusPill(s: ServiceDayDraft): { label: string; className: string } {
  if (s.mode === 'closed') {
    return { label: 'Fechado', className: 'cb-agenda-day-svc-status-closed' }
  }
  if (s.mode === 'open') {
    const times = (s.intervals.length ? s.intervals : [])
      .map((iv) => `${iv.start}–${iv.end}`)
      .join(', ')
    if (times) {
      return { label: `Horário próprio ${times}`, className: 'cb-agenda-day-svc-status-custom' }
    }
    return { label: 'Aberto', className: 'cb-agenda-day-svc-status-open' }
  }
  return { label: 'Herdado', className: 'cb-agenda-day-svc-status-inherit' }
}

/**
 * Dialog centralizado para configurar a disponibilidade de um dia concreto
 * (excepção sobre o horário semanal) + modos por serviço (Herdar / Aberto / Fechado).
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
  onSave: (draft: DayAvailabilityDraft) => void | Promise<void>
  onCopyFromDate?: (fromDate: string) => void
  saving?: boolean
}) {
  const [draft, setDraft] = useState<DayAvailabilityDraft>({
    mode: 'inherit',
    intervals: [defaultInterval],
  })
  const [copyFrom, setCopyFrom] = useState('')

  useEffect(() => {
    if (!open || !date) return
    setDraft(draftFromExisting(overrideIntervals, hasOverride, defaultInterval))
    setCopyFrom('')
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
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Serviços neste dia
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ajuste só o que for diferente do horário geral neste dia.
              </p>
              <div className="mt-3 overflow-hidden rounded-xl border border-border/50">
                <div className="hidden grid-cols-[minmax(0,1.2fr)_7rem_minmax(10rem,1fr)] gap-2 border-b border-border/40 bg-muted/20 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
                  <span>Serviço</span>
                  <span>Estado atual</span>
                  <span>Definir para este dia</span>
                </div>
                <ul>
                  {serviceDrafts.map((s) => {
                    const status = serviceStatusPill(s)
                    return (
                      <li
                        key={s.id}
                        className="border-b border-border/40 px-3 py-2.5 last:border-b-0"
                        data-testid={`agenda-day-service-${s.id}`}
                      >
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1.2fr)_7rem_minmax(10rem,1fr)] sm:items-center">
                          <p className="text-sm font-medium text-foreground">{s.name}</p>
                          <span className={cn('cb-agenda-day-svc-status', status.className)}>
                            {status.label}
                          </span>
                          <div
                            className="inline-flex w-fit rounded-lg border border-border/60 bg-background p-0.5"
                            role="group"
                            aria-label={`Disponibilidade de ${s.name}`}
                          >
                            {(
                              [
                                { mode: 'inherit' as const, label: 'Herdar' },
                                { mode: 'open' as const, label: 'Aberto' },
                                { mode: 'closed' as const, label: 'Fechado' },
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
                        </div>
                        {s.mode === 'open' ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2 sm:pl-[calc(1.2fr+7rem+0.5rem)]">
                            {(s.intervals.length ? s.intervals : [defaultInterval]).map((iv, idx) => (
                              <div key={`${s.id}-${idx}`} className="inline-flex items-center gap-1">
                                <Input
                                  type="time"
                                  className="h-8 w-[6.5rem] rounded-md text-xs"
                                  value={iv.start}
                                  aria-label={`${s.name} início ${idx + 1}`}
                                  onChange={(e: FormChangeEvent) => {
                                    const intervals = cloneIntervals(
                                      s.intervals.length ? s.intervals : [defaultInterval],
                                    )
                                    intervals[idx] = { ...intervals[idx], start: e.target.value }
                                    patchService(s.id, { intervals })
                                  }}
                                />
                                <span className="text-xs text-muted-foreground">–</span>
                                <Input
                                  type="time"
                                  className="h-8 w-[6.5rem] rounded-md text-xs"
                                  value={iv.end}
                                  aria-label={`${s.name} fim ${idx + 1}`}
                                  onChange={(e: FormChangeEvent) => {
                                    const intervals = cloneIntervals(
                                      s.intervals.length ? s.intervals : [defaultInterval],
                                    )
                                    intervals[idx] = { ...intervals[idx], end: e.target.value }
                                    patchService(s.id, { intervals })
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </div>
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
