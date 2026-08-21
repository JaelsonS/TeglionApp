import type { FormChangeEvent } from '@/shared/types/react-events'
import { useEffect, useState } from 'react'
import { Copy, Plus, Trash2 } from 'lucide-react'

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

function draftFromExisting(
  date: string,
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
 * Dialog centralizado para configurar a disponibilidade de um dia concreto
 * (excepção sobre o horário semanal). Mesmo padrão de FiscalEventFormDialog / TaskEditDialog.
 */
export function AgendaDayAvailabilityDialog({
  open,
  onOpenChange,
  date,
  hasOverride,
  overrideIntervals,
  weekdayIntervals,
  defaultInterval,
  serviceSummaries,
  onSave,
  onCopyFromDate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string | null
  hasOverride: boolean
  overrideIntervals?: TimeInterval[]
  weekdayIntervals: TimeInterval[]
  defaultInterval: TimeInterval
  /** Serviços bookable e estado efectivo nesse dia (só informativo). */
  serviceSummaries?: { id: string; name: string; label: string }[]
  onSave: (draft: DayAvailabilityDraft) => void
  onCopyFromDate?: (fromDate: string) => void
}) {
  const [draft, setDraft] = useState<DayAvailabilityDraft>({
    mode: 'inherit',
    intervals: [defaultInterval],
  })
  const [copyFrom, setCopyFrom] = useState('')

  useEffect(() => {
    if (!open || !date) return
    setDraft(draftFromExisting(date, overrideIntervals, hasOverride, defaultInterval))
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

  function handleSave() {
    if (draft.mode === 'custom' && draft.intervals.length === 0) return
    onSave(draft)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" data-testid="agenda-day-availability-dialog">
        <DialogHeader>
          <DialogTitle className="capitalize">{titleDate}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {kind === 'none'
              ? 'Sem excepção — usa o horário semanal.'
              : kind === 'closed'
                ? 'Excepção activa: dia fechado.'
                : 'Excepção activa: horário especial.'}
          </p>

          <div className="grid gap-2" role="radiogroup" aria-label="Modo do dia">
            {(
              [
                { mode: 'inherit' as const, label: 'Usar horário semanal', hint: weekdayIntervals.length
                  ? weekdayIntervals.map((iv) => `${iv.start}–${iv.end}`).join(', ')
                  : 'Dia normalmente fechado no horário semanal' },
                { mode: 'closed' as const, label: 'Dia fechado', hint: 'Nenhum slot neste dia' },
                { mode: 'custom' as const, label: 'Horário especial', hint: 'Um ou mais intervalos só neste dia' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.mode}
                type="button"
                role="radio"
                aria-checked={draft.mode === opt.mode}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left transition',
                  draft.mode === opt.mode
                    ? 'border-brand bg-brand/5 ring-1 ring-brand/30'
                    : 'border-border/60 hover:bg-muted/30',
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
                <span className="block text-sm font-medium text-foreground">{opt.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{opt.hint}</span>
              </button>
            ))}
          </div>

          {draft.mode === 'custom' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Intervalos</Label>
                <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={addInterval}>
                  <Plus className="h-3.5 w-3.5" />
                  Intervalo
                </Button>
              </div>
              <ul className="space-y-2">
                {draft.intervals.map((iv, idx) => (
                  <li key={`${idx}-${iv.start}`} className="flex flex-wrap items-center gap-2">
                    <Input
                      type="time"
                      className="h-9 w-[7.5rem] rounded-lg"
                      value={iv.start}
                      onChange={(e: FormChangeEvent) => updateInterval(idx, { start: e.target.value })}
                    />
                    <span className="text-xs text-muted-foreground">até</span>
                    <Input
                      type="time"
                      className="h-9 w-[7.5rem] rounded-lg"
                      value={iv.end}
                      onChange={(e: FormChangeEvent) => updateInterval(idx, { end: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      aria-label="Remover intervalo"
                      onClick={() => removeInterval(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
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
                  disabled={!copyFrom || copyFrom === date}
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

          {serviceSummaries && serviceSummaries.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Serviços neste dia
              </p>
              <ul className="mt-2 space-y-1.5">
                {serviceSummaries.map((s) => (
                  <li key={s.id} className="flex items-start justify-between gap-2 text-sm">
                    <span className="font-medium text-foreground">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} data-testid="agenda-day-availability-save">
            Guardar dia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
