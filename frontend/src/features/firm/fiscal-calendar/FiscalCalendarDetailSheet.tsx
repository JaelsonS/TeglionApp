import type { ChangeEvent } from 'react'
import { Copy, ExternalLink, Pencil, Archive, Power, Repeat2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import {
  formatFiscalDate,
  formatPeriodLabel,
  getCategoryStyleByToken,
  getFiscalUrgency,
  KIND_LABELS,
  RECURRENCE_LABELS,
  REGIME_LABELS,
  STATUS_LABELS,
  URGENCY_LABELS,
} from '@/features/firm/fiscal-calendar/fiscalCalendarUtils'
import type { FirmFiscalCategory, FirmFiscalEvent } from '@/infrastructure/api/contabil/fiscalCalendar'
import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { cn } from '@/shared/lib/utils'
import type { ObligationType } from '@/shared/types/contabil'
import type { Client } from '@/shared/types/clients'
import { contabilObligationsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'

export function FiscalCalendarDetailSheet({
  item,
  open,
  onOpenChange,
  categories,
  clients,
  onEdit,
  onDuplicate,
  onArchive,
  onToggleActive,
  onMarkCompleted,
}: {
  item: FirmFiscalEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: FirmFiscalCategory[]
  clients: Client[]
  onEdit: (event: FirmFiscalEvent, scope: 'series' | 'occurrence') => void
  onDuplicate: (event: FirmFiscalEvent) => void
  onArchive: (event: FirmFiscalEvent) => void
  onToggleActive: (event: FirmFiscalEvent) => void
  onMarkCompleted: (event: FirmFiscalEvent) => void
}) {
  const [quickClientId, setQuickClientId] = useState('')
  const [creatingQuick, setCreatingQuick] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (item) setQuickClientId('')
  }, [item])

  if (!item) return null
  const current = item

  const category = categories.find((c) => c.id === current.categoryId)
  const style = getCategoryStyleByToken(current.colorToken || category?.colorToken, category?.name)
  const urgency = getFiscalUrgency(current.startDate)

  const atLink =
    current.authority === 'AT'
      ? 'https://www.portaldasfinancas.gov.pt'
      : current.authority === 'Segurança Social'
        ? 'https://www.seg-social.pt'
        : null

  function fiscalCategoryToObligationType(): ObligationType {
    const c = String(category?.name || current.title || '').toLowerCase()
    if (c.includes('iva')) return 'IVA'
    if (c.includes('irc')) return 'IRC'
    if (c.includes('irs')) return 'IRS'
    if (c.includes('segurança') || c.includes('social')) return 'SS'
    if (c.includes('saft') || c.includes('saf-t')) return 'SAFT'
    if (c.includes('ies')) return 'IES'
    return 'CUSTOM'
  }

  async function quickCreateObligation() {
    if (!quickClientId) {
      toast.error('Selecione a empresa para criar a obrigação')
      return
    }
    const type = fiscalCategoryToObligationType()
    setCreatingQuick(true)
    try {
      const created = (await contabilObligationsApi.create({
        clientId: quickClientId,
        type,
        period: current.periodLabel || current.startDate.slice(0, 7),
        dueDate: current.startDate,
        title: current.title,
        accountantNotes: current.notes || current.description || undefined,
        createClientTask: true,
      })) as { _id?: string; id?: string }
      const obligationId = created?._id || created?.id
      toast.success('Obrigação criada com sucesso', {
        description: 'O cliente foi notificado por email.',
        action: obligationId
          ? {
              label: 'Ver obrigação',
              onClick: () => {
                navigate(`/app/firm/tasks/obligations?ob=${obligationId}`)
                onOpenChange(false)
              },
            }
          : undefined,
        duration: 8000,
      })
      if (!obligationId) onOpenChange(false)
    } catch (err) {
      toast.error('Não foi possível criar obrigação', { description: getErrorMessage(err) })
    } finally {
      setCreatingQuick(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="shrink-0 border-b border-border/60 px-5 py-4 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', style.pill)}>
              {style.label}
            </span>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                current.eventKind === 'INTERNAL'
                  ? 'bg-slate-500/15 text-slate-700'
                  : 'bg-brand/10 text-brand',
              )}
            >
              {KIND_LABELS[current.eventKind] || current.eventKind}
            </span>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                urgency === 'overdue' && 'bg-rose-500/15 text-rose-700',
                urgency === 'soon' && 'bg-amber-500/15 text-amber-800',
                urgency === 'upcoming' && 'bg-sky-500/15 text-sky-800',
                urgency === 'future' && 'bg-muted text-muted-foreground',
              )}
            >
              {URGENCY_LABELS[urgency]}
            </span>
            {current.isRecurring ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                <Repeat2 className="h-3 w-3" />
                Recorrente
                {current.recurrence?.frequency
                  ? ` · ${RECURRENCE_LABELS[current.recurrence.frequency] || ''}`
                  : ''}
              </span>
            ) : null}
          </div>
          <SheetTitle className="mt-2 text-base leading-snug">{current.title}</SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-5 py-4">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
                {formatFiscalDate(current.startDate)}
                {current.startTime ? ` · ${String(current.startTime).slice(0, 5)}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</dt>
              <dd className="mt-0.5 text-foreground">{STATUS_LABELS[current.status] || current.status}</dd>
            </div>
            {current.periodLabel ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Período</dt>
                <dd className="mt-0.5 text-foreground">{formatPeriodLabel(current.periodLabel)}</dd>
              </div>
            ) : null}
            {current.authority ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Entidade</dt>
                <dd className="mt-0.5 flex items-center gap-2 text-foreground">
                  {current.authority}
                  {atLink ? (
                    <a
                      href={atLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                    >
                      Portal
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </dd>
              </div>
            ) : null}
            {current.regimes?.length ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Regimes</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {current.regimes.map((r) => (
                    <span key={r} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {REGIME_LABELS[r] ?? r}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
            {current.description ? (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <dt className="text-xs font-medium text-muted-foreground">Descrição</dt>
                <dd className="mt-1 text-sm text-foreground">{current.description}</dd>
              </div>
            ) : null}
            {current.notes ? (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <dt className="text-xs font-medium text-muted-foreground">Observações</dt>
                <dd className="mt-1 text-sm text-foreground">{current.notes}</dd>
              </div>
            ) : null}
          </dl>

          <section className="mt-5 grid gap-2 border-t border-border/60 pt-4">
            <Button type="button" variant="outline" className="justify-start gap-2" onClick={() => onEdit(current, 'occurrence')}>
              <Pencil className="h-4 w-4" />
              {current.isRecurring ? 'Editar apenas este evento' : 'Editar'}
            </Button>
            {current.isRecurring ? (
              <Button type="button" variant="outline" className="justify-start gap-2" onClick={() => onEdit(current, 'series')}>
                <Repeat2 className="h-4 w-4" />
                Editar toda a série
              </Button>
            ) : null}
            <Button type="button" variant="outline" className="justify-start gap-2" onClick={() => onDuplicate(current)}>
              <Copy className="h-4 w-4" />
              Duplicar
            </Button>
            {current.status !== 'COMPLETED' ? (
              <Button type="button" variant="outline" className="justify-start" onClick={() => onMarkCompleted(current)}>
                Marcar como concluído
              </Button>
            ) : null}
            <Button type="button" variant="outline" className="justify-start gap-2" onClick={() => onToggleActive(current)}>
              <Power className="h-4 w-4" />
              {current.isActive ? 'Desativar' : 'Ativar'}
            </Button>
            <Button type="button" variant="outline" className="justify-start gap-2 text-rose-700" onClick={() => onArchive(current)}>
              <Archive className="h-4 w-4" />
              Arquivar
            </Button>
          </section>
        </div>

        {current.eventKind === 'FISCAL' ? (
          <div className="shrink-0 border-t border-border/60 px-5 py-4">
            <div className="grid gap-2">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Criação rápida de obrigação
                </p>
                <select
                  className="mb-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={quickClientId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setQuickClientId(e.target.value)}
                >
                  <option value="">Selecionar empresa…</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.fullName || c.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => void quickCreateObligation()}
                  disabled={!quickClientId || creatingQuick}
                >
                  {creatingQuick ? 'A criar…' : 'Criar agora e notificar cliente'}
                </Button>
              </div>
              <Button
                type="button"
                variant="default"
                className="w-full"
                onClick={() => {
                  const createType = fiscalCategoryToObligationType()
                  const qs = new URLSearchParams({
                    create: '1',
                    createType,
                    createPeriod: current.periodLabel || current.startDate.slice(0, 7),
                    createDueDate: current.startDate || '',
                  })
                  navigate(`/app/firm/tasks/obligations?${qs}`)
                  onOpenChange(false)
                }}
              >
                Criar obrigação (pré-preenchida)
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/app/firm/tasks/obligations">Ver obrigações dos clientes</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
