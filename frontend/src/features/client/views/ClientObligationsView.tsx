import { useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { useQuery } from '@tanstack/react-query'
import { Calendar, ChevronDown, Download, Eye, FileText, Landmark, Wallet } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import {
  DocumentPreviewModal,
  getViewSessionId,
} from '@/shared/components/contabil/DocumentPreviewModal'
import { getClientHubCopy } from '@/features/client/clientHubI18n'
import { EmptyState } from '@/shared/components/portal-cliente/EmptyState'
import { StatusPill, type StatusPillVariant } from '@/shared/components/portal-cliente/StatusPill'
import { PortalFadeIn } from '@/shared/components/portal-cliente/PortalMotion'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/design-system'
import { clientPortalContabilApi, fetchDocumentPreviewUrl } from '@/infrastructure/api'
import type { ContabilDocument, Obligation } from '@/shared/types/contabil'
import { clientDocumentDisplayName } from '@/shared/utils/clientDocumentLabel'
import { formatEuro, formatPtDate } from '@/shared/utils/contabilLocale'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

type PeriodMode = 'all' | 'month' | 'quarter' | 'year'

type AgendaStatus = {
  label: 'Enviado' | 'Pago' | 'Em atraso' | 'Parcelado'
  variant: StatusPillVariant
}

type ObligationAgendaItem = Obligation & {
  sentAt: string
  statusDisplay: AgendaStatus
  attachments: ContabilDocument[]
}

function obligationIcon(type: string) {
  const t = type.toUpperCase()
  if (t.includes('IVA')) return Landmark
  if (t.includes('SS') || t.includes('PAYROLL')) return Wallet
  return FileText
}

function isInstallment(o: Obligation) {
  const text = `${o.accountantNotes || ''} ${o.notes || ''} ${o.title || ''}`.toLowerCase()
  return /(parcel|prestaç|prestac|fracion|fasead)/i.test(text)
}

function resolveAgendaStatus(o: Obligation): AgendaStatus {
  if (o.paymentStatus === 'PAID') return { label: 'Pago', variant: 'done' }
  if (isInstallment(o)) return { label: 'Parcelado', variant: 'in_review' }
  if (new Date(o.dueDate).getTime() < Date.now() && o.status !== 'DELIVERED' && o.status !== 'CANCELLED') {
    return { label: 'Em atraso', variant: 'overdue' }
  }
  return { label: 'Enviado', variant: 'submitted' }
}

function inPeriod(sentAt: string, mode: PeriodMode) {
  if (mode === 'all') return true
  const date = new Date(sentAt)
  if (Number.isNaN(date.getTime())) return true
  const now = new Date()
  if (mode === 'year') return date.getFullYear() === now.getFullYear()
  if (mode === 'quarter') {
    const q = Math.floor(now.getMonth() / 3)
    return date.getFullYear() === now.getFullYear() && Math.floor(date.getMonth() / 3) === q
  }
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

function sentAtFromObligation(o: Obligation) {
  return o.deliveredAt || o.createdAt || o.updatedAt || o.dueDate
}

export function ClientObligationsView({
  t,
}: {
  t: ReturnType<typeof getClientHubCopy>
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('obligation') || ''
  const [period, setPeriod] = useState<PeriodMode>('all')
  const [search, setSearch] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  const query = useQuery({
    queryKey: ['client-agenda-fiscal'],
    queryFn: async () => {
      const [obligationsRes, docsRes] = await Promise.all([
        clientPortalContabilApi.listObligations() as Promise<{ items?: Obligation[] }>,
        clientPortalContabilApi.listMyDocuments({ limit: 400 }) as Promise<{ items?: ContabilDocument[] }>,
      ])
      return {
        obligations: obligationsRes.items ?? [],
        documents: docsRes.items ?? [],
      }
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const items = useMemo<ObligationAgendaItem[]>(() => {
    const docsByObligation = new Map<string, ContabilDocument[]>()
    for (const doc of query.data?.documents || []) {
      if (!doc.obligationId) continue
      if (!docsByObligation.has(doc.obligationId)) docsByObligation.set(doc.obligationId, [])
      docsByObligation.get(doc.obligationId)!.push(doc)
    }

    const q = search.trim().toLowerCase()
    const obligationsById = new Map<string, Obligation>()
    for (const o of query.data?.obligations || []) {
      const id = String(o._id || o.id || '')
      if (!id) continue
      obligationsById.set(id, o)
    }

    return [...obligationsById.values()]
      .map((o) => {
        const sentAt = sentAtFromObligation(o)
        const attachmentsById = new Map<string, ContabilDocument>()
        for (const doc of [...(docsByObligation.get(o._id) || []), ...(docsByObligation.get(String(o.id || '')) || [])]) {
          attachmentsById.set(String(doc._id), doc)
        }
        return {
          ...o,
          sentAt,
          attachments: [...attachmentsById.values()],
          statusDisplay: resolveAgendaStatus(o),
        }
      })
      .filter((o) => inPeriod(o.sentAt, period))
      .filter((o) => {
        if (!q) return true
        const hay = `${o.title || ''} ${o.type || ''} ${o.accountantNotes || ''} ${o.notes || ''}`.toLowerCase()
        return hay.includes(q)
      })
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
  }, [period, query.data?.documents, query.data?.obligations, search])

  const selected = useMemo(
    () => items.find((o) => o._id === selectedId) || items[items.length - 1] || null,
    [items, selectedId],
  )

  const selectItem = (id: string) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.set('obligation', id)
      return p
    })
  }

  const openDocument = async (doc: ContabilDocument) => {
    setPreviewTitle(clientDocumentDisplayName(doc))
    setPreviewOpen(true)
    setPreviewLoading(true)
    try {
      await clientPortalContabilApi.recordDocumentView(doc._id, getViewSessionId())
      setPreviewUrl(await fetchDocumentPreviewUrl(doc._id, 'client'))
    } catch (err) {
      toast.error('Não foi possível abrir', { description: getErrorMessage(err) })
      setPreviewOpen(false)
    } finally {
      setPreviewLoading(false)
    }
  }

  const downloadDocument = async (doc: ContabilDocument) => {
    try {
      const url = await fetchDocumentPreviewUrl(doc._id, 'client')
      if (!url) throw new Error('URL indisponível')
      const a = document.createElement('a')
      a.href = url
      a.download = clientDocumentDisplayName(doc)
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Transferência falhou', { description: getErrorMessage(err) })
    }
  }

  const markAsPaid = async (obligationId: string) => {
    try {
      await clientPortalContabilApi.markObligationPaid(obligationId)
      toast.success('Pagamento registado')
      await query.refetch()
    } catch (err) {
      toast.error('Não foi possível actualizar', { description: getErrorMessage(err) })
    }
  }

  if (query.isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[12px]" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-[12px]" />
      </div>
    )
  }

  if (query.isError) {
    return <p className="text-sm text-destructive">{getErrorMessage(query.error)}</p>
  }

  return (
    <>
      <div className="grid min-h-[32rem] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="pc-card flex min-h-0 flex-col">
          <div className="shrink-0 space-y-3 border-b border-border p-4">
            <Input
              value={search}
              onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
              placeholder="Pesquisar na agenda…"
              className="rounded-[10px]"
            />
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['all', 'Tudo'],
                  ['month', 'Mês'],
                  ['quarter', 'Trimestre'],
                  ['year', 'Ano'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={cn('pc-pill', period === id && 'pc-pill-active')}
                  onClick={() => setPeriod(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {items.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Agenda sem eventos neste período"
                description="Quando o escritório enviar obrigações, elas aparecem aqui por ordem cronológica."
              />
            ) : (
              <ol className="space-y-2">
                {items.map((o) => {
                  const Icon = obligationIcon(o.type)
                  return (
                    <li key={o._id}>
                      <button
                        type="button"
                        className={cn(
                          'w-full rounded-xl border border-border/70 bg-card p-3 text-left transition hover:border-brand/40 hover:bg-muted/20',
                          selected?._id === o._id && 'border-brand/40 bg-brand/[0.04]',
                        )}
                        onClick={() => selectItem(o._id)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-brand">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-foreground">{o.title || `${o.type} enviado`}</p>
                              <StatusPill variant={o.statusDisplay.variant}>{o.statusDisplay.label}</StatusPill>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatPtDate(o.sentAt, 'date')} · {o.type}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Prazo {formatPtDate(o.dueDate, 'date')} · Valor {o.amountCents != null ? formatEuro(o.amountCents) : '—'}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {o.attachments.length} anexo{o.attachments.length === 1 ? '' : 's'}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </div>

        <PortalFadeIn className={cn('pc-card min-h-[24rem] lg:min-h-0', !selected && 'hidden lg:block')}>
          {selected ? (
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 border-b border-border/60 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">{selected.title || selected.type}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{selected.type}</p>
                  </div>
                  <StatusPill variant={selected.statusDisplay.variant}>{selected.statusDisplay.label}</StatusPill>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                <section className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dados da obrigação</p>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">Data de envio</dt>
                      <dd className="font-medium text-foreground">{formatPtDate(selected.sentAt, 'date')}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Data limite de pagamento</dt>
                      <dd className="font-medium text-foreground">{formatPtDate(selected.dueDate, 'date')}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Status</dt>
                      <dd className="font-medium text-foreground">{selected.statusDisplay.label}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Valor a pagar</dt>
                      <dd className="font-medium text-foreground">
                        {selected.amountCents != null ? formatEuro(selected.amountCents) : '—'}
                      </dd>
                    </div>
                  </dl>
                </section>

                {selected.accountantNotes || selected.notes ? (
                  <section className="rounded-xl border border-border/60 bg-card p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observações do escritório</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {selected.accountantNotes || selected.notes}
                    </p>
                  </section>
                ) : null}

                <section className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Anexos</p>
                    <span className="text-xs text-muted-foreground">
                      {selected.attachments.length} ficheiro{selected.attachments.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  {selected.attachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">O escritório ainda não anexou documentos para esta obrigação.</p>
                  ) : (
                    <ul className="space-y-2">
                      {selected.attachments.map((doc) => (
                        <li key={doc._id} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{clientDocumentDisplayName(doc)}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.createdAt ? formatPtDate(doc.createdAt, 'date') : 'Sem data'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button type="button" variant="outline" size="sm" className="rounded-[10px]" onClick={() => void openDocument(doc)}>
                                <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver
                              </Button>
                              <Button type="button" variant="outline" size="sm" className="rounded-[10px]" onClick={() => void downloadDocument(doc)}>
                                <Download className="mr-1.5 h-3.5 w-3.5" /> Transferir
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {selected.paymentStatus !== 'PAID' ? (
                  <div className="pt-1">
                    <Button type="button" className="rounded-[10px]" onClick={() => void markAsPaid(selected._id)}>
                      {t.obligations.markPaid}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
              <div>
                <ChevronDown className="mx-auto mb-2 h-6 w-6 rotate-[-90deg] opacity-40" />
                <p className="text-sm">Selecione um evento da agenda para ver os detalhes.</p>
              </div>
            </div>
          )}
        </PortalFadeIn>
      </div>

      <DocumentPreviewModal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false)
          setPreviewUrl(null)
        }}
        title={previewTitle}
        previewUrl={previewUrl}
        loading={previewLoading}
      />
    </>
  )
}
