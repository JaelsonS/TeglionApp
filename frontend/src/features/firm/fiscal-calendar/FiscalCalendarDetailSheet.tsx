import type { ChangeEvent } from 'react'
import { ExternalLink, StickyNote } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import {
  formatFiscalDate,
  formatPeriodLabel,
  getFiscalCategoryStyle,
  getFiscalUrgency,
  REGIME_LABELS,
  URGENCY_LABELS,
  type FiscalCalendarItem,
} from '@/features/firm/fiscal-calendar/fiscalCalendarUtils'
import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { Textarea } from '@/shared/components/ui/textarea'
import { cn } from '@/shared/lib/utils'
import type { ObligationType } from '@/shared/types/contabil'
import type { Client } from '@/shared/types/clients'
import { contabilObligationsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'

export function FiscalCalendarDetailSheet({
  item,
  open,
  onOpenChange,
  accountantNote,
  onSaveNote,
  clients,
}: {
  item: FiscalCalendarItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  accountantNote: string
  onSaveNote: (itemId: string, text: string) => void
  clients: Client[]
}) {
  const [draft, setDraft] = useState('')
  const [dirty, setDirty] = useState(false)
  const [quickClientId, setQuickClientId] = useState('')
  const [creatingQuick, setCreatingQuick] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (item) {
      setDraft(accountantNote)
      setDirty(false)
      setQuickClientId('')
    }
  }, [item, accountantNote])

  if (!item) return null
  const currentItem = item

  const style = getFiscalCategoryStyle(currentItem.category)
  const urgency = getFiscalUrgency(currentItem.dueDate)

  const atLink =
    currentItem.authority === 'AT'
      ? 'https://www.portaldasfinancas.gov.pt'
      : currentItem.authority === 'Segurança Social'
        ? 'https://www.seg-social.pt'
        : null

  function fiscalCategoryToObligationType(category: string): ObligationType {
    const c = String(category || '').toLowerCase()
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
    const type = fiscalCategoryToObligationType(currentItem.category)
    setCreatingQuick(true)
    try {
      const created = (await contabilObligationsApi.create({
        clientId: quickClientId,
        type,
        period: currentItem.period,
        dueDate: currentItem.dueDate,
        title: currentItem.title,
        accountantNotes: currentItem.notes || undefined,
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
                urgency === 'overdue' && 'bg-rose-500/15 text-rose-700',
                urgency === 'soon' && 'bg-amber-500/15 text-amber-800',
                urgency === 'upcoming' && 'bg-sky-500/15 text-sky-800',
                urgency === 'future' && 'bg-muted text-muted-foreground',
              )}
            >
              {URGENCY_LABELS[urgency]}
            </span>
          </div>
          <SheetTitle className="mt-2 text-base leading-snug">{currentItem.title}</SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-5 py-4">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prazo</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-foreground">{formatFiscalDate(currentItem.dueDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Período de referência</dt>
              <dd className="mt-0.5 text-foreground">{formatPeriodLabel(currentItem.period)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Entidade</dt>
              <dd className="mt-0.5 flex items-center gap-2 text-foreground">
                {currentItem.authority}
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
            {currentItem.regimes?.length ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Regimes</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {currentItem.regimes.map((r) => (
                    <span key={r} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {REGIME_LABELS[r] ?? r}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
            {currentItem.notes ? (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <dt className="text-xs font-medium text-muted-foreground">Nota oficial</dt>
                <dd className="mt-1 text-sm text-foreground">{currentItem.notes}</dd>
              </div>
            ) : null}
          </dl>

          <section className="mt-5 border-t border-border/60 pt-4">
            <div className="mb-2 flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-semibold text-foreground">Notas do contabilista</h3>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">
              Anote lembretes internos para a equipa. Visível apenas no escritório.
            </p>
            <Textarea
              value={draft}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                setDraft(e.target.value)
                setDirty(true)
              }}
              rows={4}
              placeholder="Ex.: Confirmar com cliente X antes do dia 15…"
              className="resize-none text-sm"
            />
            {dirty ? (
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDraft(accountantNote)
                    setDirty(false)
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onSaveNote(currentItem.id, draft)
                    setDirty(false)
                  }}
                >
                  Guardar nota
                </Button>
              </div>
            ) : null}
          </section>
        </div>

        <div className="shrink-0 border-t border-border/60 px-5 py-4">
          <div className="grid gap-2">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Criação rápida (só escolher empresa)
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
                const createType = fiscalCategoryToObligationType(currentItem.category)
                const qs = new URLSearchParams({
                  create: '1',
                  createType,
                  createPeriod: currentItem.period || '',
                  createDueDate: currentItem.dueDate || '',
                })
                navigate(`/app/firm/tasks/obligations?${qs}`)
                onOpenChange(false)
              }}
              disabled={!currentItem.dueDate || !currentItem.period}
            >
              Criar obrigação (pré-preenchida)
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/app/firm/tasks/obligations">Ver obrigações dos clientes</Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
