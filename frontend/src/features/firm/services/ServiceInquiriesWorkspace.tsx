import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Inbox, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'
import { SheetHiddenTitle } from '@/shared/components/ui/sheet-hidden-title'
import { contabilAccountingServicesApi, contabilServiceInquiriesApi } from '@/infrastructure/api'
import type { ServiceInquiryChecklistItem } from '@/infrastructure/api/contabil/serviceInquiries'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import type { AccountingService, IntakeQuestion } from '@/shared/types/contabil'

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Novo',
  CONTACTED: 'Contactado',
  DOCS_REQUESTED: 'Aguarda documentos',
  IN_PROGRESS: 'Em progresso',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const STATUS_ORDER = ['NEW', 'CONTACTED', 'DOCS_REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED'])

function answerDisplay(question: IntakeQuestion | undefined, value: string | string[]) {
  if (!question?.options) return Array.isArray(value) ? value.join(', ') : String(value)
  const resolve = (v: string) => question.options?.find((o) => (o.id ?? o.label) === v)?.label ?? v
  return Array.isArray(value) ? value.map(resolve).join(', ') : resolve(value)
}

export function ServiceInquiriesWorkspace() {
  const qc = useQueryClient()
  const [serviceFilter, setServiceFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const servicesQuery = useQuery({
    queryKey: ['contabil-accounting-services', 'all'],
    queryFn: () => contabilAccountingServicesApi.list(),
  })
  const services: AccountingService[] = servicesQuery.data?.items ?? []

  const listQuery = useQuery({
    queryKey: ['service-inquiries', serviceFilter],
    queryFn: () => contabilServiceInquiriesApi.list(serviceFilter ? { serviceId: serviceFilter } : undefined),
  })
  const items = listQuery.data?.items ?? []

  const detailQuery = useQuery({
    queryKey: ['service-inquiry-detail', selectedId],
    queryFn: () => contabilServiceInquiriesApi.getById(selectedId!),
    enabled: Boolean(selectedId),
  })

  const selectedService = useMemo(
    () => services.find((s) => s.id === detailQuery.data?.inquiry.serviceId),
    [services, detailQuery.data],
  )
  const questions = selectedService?.intakeForm?.questions ?? []

  const updateStatus = async (status: string) => {
    if (!selectedId) return
    try {
      await contabilServiceInquiriesApi.patch(selectedId, { status });
      toast.success('Estado actualizado')
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['service-inquiries'] }),
        qc.invalidateQueries({ queryKey: ['service-inquiry-detail', selectedId] }),
      ])
    } catch (err) {
      toast.error('Erro ao actualizar estado', { description: getErrorMessage(err) })
    }
  }

  const downloadDocument = async (documentId: string) => {
    if (!selectedId) return
    try {
      const { url } = await contabilServiceInquiriesApi.getDocumentDownloadUrl(selectedId, documentId)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error('Erro ao abrir documento', { description: getErrorMessage(err) })
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setServiceFilter('')}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-semibold transition',
            serviceFilter === '' ? 'bg-brand text-primary-foreground shadow-sm' : 'bg-muted/40 text-muted-foreground',
          )}
        >
          Todos os serviços
        </button>
        {services.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setServiceFilter(s.id)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-semibold transition',
              serviceFilter === s.id ? 'bg-brand text-primary-foreground shadow-sm' : 'bg-muted/40 text-muted-foreground',
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      {listQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-10 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Ainda sem solicitações recebidas pela página pública.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/50">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-border/40 bg-muted/30 px-3 py-2 text-caption font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Solicitação</span>
            <span className="hidden sm:block">Serviço</span>
            <span>Estado</span>
          </div>
          <ul className="divide-y divide-border/40">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-3 text-left hover:bg-muted/20"
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className="min-w-0 truncate text-sm font-medium">
                    {item.requesterName || 'Sem nome'}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:block">{item.serviceName || '—'}</span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-caption font-bold uppercase',
                      TERMINAL_STATUSES.has(item.status)
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-emerald-100 text-emerald-800',
                    )}
                  >
                    {STATUS_LABELS[item.status] || item.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Sheet open={Boolean(selectedId)} onOpenChange={(open: boolean) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHiddenTitle>Detalhe da solicitação</SheetHiddenTitle>
          {detailQuery.isLoading || !detailQuery.data ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {detailQuery.data.inquiry.serviceName || 'Serviço'}
                </p>
                <h2 className="text-lg font-bold">{detailQuery.data.inquiry.requesterName || 'Sem nome'}</h2>
              </div>

              <label className="block space-y-1 text-sm">
                <span className="font-medium text-muted-foreground">Estado</span>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={detailQuery.data.inquiry.status}
                  onChange={(e) => void updateStatus(e.target.value)}
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>

              {questions.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Respostas</p>
                  <div className="space-y-2 rounded-lg border border-border/40 p-3">
                    {questions.map((q: IntakeQuestion, index: number) => {
                      const value = detailQuery.data!.inquiry.answers?.[q.id ?? String(index)]
                      if (value === undefined) return null
                      return (
                        <div key={q.id ?? index} className="text-sm">
                          <span className="font-medium">{q.label}: </span>
                          <span className="text-muted-foreground">{answerDisplay(q, value)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documentos</p>
                {detailQuery.data.checklist.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem documentos pedidos para este serviço.</p>
                ) : (
                  <ul className="space-y-2">
                    {detailQuery.data.checklist.map((doc: ServiceInquiryChecklistItem) => (
                      <li
                        key={doc.tag}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border/40 p-2"
                      >
                        <span className="min-w-0 truncate text-sm">{doc.title}</span>
                        {doc.received && doc.documentId ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="shrink-0 rounded-full"
                            onClick={() => void downloadDocument(doc.documentId!)}
                          >
                            <FileText className="mr-1.5 h-3.5 w-3.5" /> Ver
                          </Button>
                        ) : (
                          <span className="shrink-0 text-xs text-muted-foreground">Pendente</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
