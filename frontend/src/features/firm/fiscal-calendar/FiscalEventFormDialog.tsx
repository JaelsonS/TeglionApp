import type { FormEvent, ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'

import {
  KIND_LABELS,
  RECURRENCE_LABELS,
  STATUS_LABELS,
} from '@/features/firm/fiscal-calendar/fiscalCalendarUtils'
import type {
  FirmFiscalCategory,
  FirmFiscalEvent,
  FirmFiscalRecurrence,
} from '@/infrastructure/api/contabil/fiscalCalendar'
import { CALENDAR_COLOR_PALETTE, getCalendarColorStyle, todayCivil } from '@/shared/calendar'
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
import { Textarea } from '@/shared/components/ui/textarea'
import { cn } from '@/shared/lib/utils'

export type EventFormValues = {
  title: string
  description: string
  notes: string
  startDate: string
  startTime: string
  categoryId: string
  eventKind: 'FISCAL' | 'INTERNAL'
  status: FirmFiscalEvent['status']
  priority: FirmFiscalEvent['priority']
  colorToken: string
  authority: string
  periodLabel: string
  recurrenceEnabled: boolean
  recurrenceFrequency: FirmFiscalRecurrence['frequency']
  recurrenceDayOfMonth: string
  scope: 'series' | 'occurrence'
  occurrenceDate?: string
}

function emptyValues(defaults?: Partial<EventFormValues>): EventFormValues {
  return {
    title: '',
    description: '',
    notes: '',
    startDate: todayCivil(),
    startTime: '',
    categoryId: '',
    eventKind: 'FISCAL',
    status: 'SCHEDULED',
    priority: 'NORMAL',
    colorToken: '',
    authority: '',
    periodLabel: '',
    recurrenceEnabled: false,
    recurrenceFrequency: 'MONTHLY',
    recurrenceDayOfMonth: '',
    scope: 'series',
    ...defaults,
  }
}

function fromEvent(event: FirmFiscalEvent, editScope: 'series' | 'occurrence'): EventFormValues {
  return emptyValues({
    title: event.title,
    description: event.description || '',
    notes: event.notes || '',
    startDate: event.startDate,
    startTime: event.startTime ? String(event.startTime).slice(0, 5) : '',
    categoryId: event.categoryId || '',
    eventKind: event.eventKind,
    status: event.status,
    priority: event.priority,
    colorToken: event.colorToken || '',
    authority: event.authority || '',
    periodLabel: event.periodLabel || '',
    recurrenceEnabled: Boolean(event.recurrence),
    recurrenceFrequency: event.recurrence?.frequency || 'MONTHLY',
    recurrenceDayOfMonth: event.recurrence?.dayOfMonth != null ? String(event.recurrence.dayOfMonth) : '',
    scope: editScope,
    occurrenceDate: event.occurrenceDate || event.startDate,
  })
}

export function FiscalEventFormDialog({
  open,
  onOpenChange,
  categories,
  initialEvent,
  editScope = 'series',
  onSubmit,
  saving,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: FirmFiscalCategory[]
  initialEvent?: FirmFiscalEvent | null
  editScope?: 'series' | 'occurrence'
  onSubmit: (values: EventFormValues) => Promise<void> | void
  saving?: boolean
}) {
  const isEdit = Boolean(initialEvent?.id)
  const isRecurring = Boolean(initialEvent?.recurrence || initialEvent?.isRecurring)
  const [values, setValues] = useState<EventFormValues>(emptyValues())
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setValues(initialEvent ? fromEvent(initialEvent, editScope) : emptyValues())
  }, [open, initialEvent, editScope])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!values.title.trim()) {
      setError('Indique um título para o evento.')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.startDate)) {
      setError('Data inválida.')
      return
    }
    setError('')
    await onSubmit(values)
  }

  function setField<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-xl flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="shrink-0 border-b border-border/60 px-5 py-4 text-left">
          <DialogTitle>{isEdit ? 'Editar evento' : 'Novo evento'}</DialogTitle>
          {isEdit && isRecurring ? (
            <p className="text-sm text-muted-foreground">Este evento é recorrente.</p>
          ) : null}
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {isEdit && isRecurring ? (
              <section className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Âmbito da edição
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-medium',
                      values.scope === 'occurrence'
                        ? 'bg-brand text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                    onClick={() => setField('scope', 'occurrence')}
                  >
                    Apenas este evento
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-medium',
                      values.scope === 'series'
                        ? 'bg-brand text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                    onClick={() => setField('scope', 'series')}
                  >
                    Toda a série
                  </button>
                </div>
              </section>
            ) : null}

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Geral</h3>
              <div className="space-y-1.5">
                <Label htmlFor="fiscal-event-title">Título</Label>
                <Input
                  id="fiscal-event-title"
                  value={values.title}
                  onChange={(e: FormChangeEvent) => setField('title', e.target.value)}
                  placeholder="Ex.: Entrega IVA — Agosto"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fiscal-event-desc">Descrição</Label>
                <Textarea
                  id="fiscal-event-desc"
                  value={values.description}
                  onChange={(e: FormChangeEvent) => setField('description', e.target.value)}
                  rows={3}
                  placeholder="Detalhes do prazo ou obrigação…"
                />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quando</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fiscal-event-date">Data</Label>
                  <Input
                    id="fiscal-event-date"
                    type="date"
                    value={values.startDate}
                    onChange={(e: FormChangeEvent) => setField('startDate', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fiscal-event-time">Hora (opcional)</Label>
                  <Input
                    id="fiscal-event-time"
                    type="time"
                    value={values.startTime}
                    onChange={(e: FormChangeEvent) => setField('startTime', e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Classificação</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fiscal-event-category">Categoria</Label>
                  <select
                    id="fiscal-event-category"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={values.categoryId}
                    onChange={(e: FormChangeEvent) => setField('categoryId', e.target.value)}
                  >
                    <option value="">Sem categoria</option>
                    {categories.filter((c) => c.isActive).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fiscal-event-kind">Tipo</Label>
                  <select
                    id="fiscal-event-kind"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={values.eventKind}
                    onChange={(e: FormChangeEvent) => setField('eventKind', e.target.value as 'FISCAL' | 'INTERNAL')}
                  >
                    {Object.entries(KIND_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fiscal-event-status">Estado</Label>
                  <select
                    id="fiscal-event-status"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={values.status}
                    onChange={(e: FormChangeEvent) => setField('status', e.target.value as FirmFiscalEvent['status'])}
                  >
                    {Object.entries(STATUS_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fiscal-event-priority">Prioridade</Label>
                  <select
                    id="fiscal-event-priority"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={values.priority}
                    onChange={(e: FormChangeEvent) => setField('priority', e.target.value as FirmFiscalEvent['priority'])}
                  >
                    <option value="LOW">Baixa</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs',
                      !values.colorToken ? 'bg-brand text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                    onClick={() => setField('colorToken', '')}
                  >
                    Categoria
                  </button>
                  {CALENDAR_COLOR_PALETTE.map((token) => {
                    const style = getCalendarColorStyle(token)
                    return (
                      <button
                        key={token}
                        type="button"
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                          style.pill,
                          values.colorToken === token && 'ring-2 ring-brand ring-offset-1',
                        )}
                        onClick={() => setField('colorToken', token)}
                        aria-label={style.label}
                      >
                        <span className={cn('h-2 w-2 rounded-full', style.dot)} />
                        {style.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>

            {values.scope === 'series' ? (
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recorrência</h3>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={values.recurrenceEnabled}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setField('recurrenceEnabled', e.target.checked)}
                  />
                  Evento recorrente
                </label>
                {values.recurrenceEnabled ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="fiscal-event-freq">Frequência</Label>
                      <select
                        id="fiscal-event-freq"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={values.recurrenceFrequency}
                        onChange={(e: FormChangeEvent) =>
                          setField('recurrenceFrequency', e.target.value as FirmFiscalRecurrence['frequency'])
                        }
                      >
                        {Object.entries(RECURRENCE_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fiscal-event-dom">Dia do mês</Label>
                      <Input
                        id="fiscal-event-dom"
                        type="number"
                        min={1}
                        max={31}
                        value={values.recurrenceDayOfMonth}
                        onChange={(e: FormChangeEvent) => setField('recurrenceDayOfMonth', e.target.value)}
                        placeholder="Ex.: 20"
                      />
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Extras</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fiscal-event-authority">Entidade</Label>
                  <Input
                    id="fiscal-event-authority"
                    value={values.authority}
                    onChange={(e: FormChangeEvent) => setField('authority', e.target.value)}
                    placeholder="AT, Segurança Social…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fiscal-event-period">Período</Label>
                  <Input
                    id="fiscal-event-period"
                    value={values.periodLabel}
                    onChange={(e: FormChangeEvent) => setField('periodLabel', e.target.value)}
                    placeholder="2026-08 / 2026-Q1"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fiscal-event-notes">Observações internas</Label>
                <Textarea
                  id="fiscal-event-notes"
                  value={values.notes}
                  onChange={(e: FormChangeEvent) => setField('notes', e.target.value)}
                  rows={2}
                />
              </div>
            </section>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>

          <DialogFooter className="shrink-0 border-t border-border/60 px-5 py-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'A guardar…' : isEdit ? 'Guardar alterações' : 'Criar evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function buildEventPayload(values: EventFormValues) {
  const recurrence =
    values.scope === 'series' && values.recurrenceEnabled
      ? {
          frequency: values.recurrenceFrequency,
          intervalCount: 1,
          dayOfMonth: values.recurrenceDayOfMonth ? Number(values.recurrenceDayOfMonth) : null,
        }
      : values.scope === 'series' && !values.recurrenceEnabled
        ? null
        : undefined

  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    notes: values.notes.trim() || null,
    startDate: values.startDate,
    startTime: values.startTime || null,
    categoryId: values.categoryId || null,
    eventKind: values.eventKind,
    status: values.status,
    priority: values.priority,
    colorToken: values.colorToken || null,
    authority: values.authority.trim() || null,
    periodLabel: values.periodLabel.trim() || null,
    recurrence,
    scope: values.scope,
    occurrenceDate: values.occurrenceDate,
  }
}
