import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Inbox, Loader2, Mail, Phone, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'
import { SheetHiddenTitle } from '@/shared/components/ui/sheet-hidden-title'
import { contabilAccountingServicesApi, contabilClientsApi, contabilLeadsApi, contabilServiceInquiriesApi } from '@/infrastructure/api'
import type {
  ServiceInquiryChecklistItem,
  ServiceInquiryHistoryItem,
  ServiceInquiryRequestKind,
} from '@/infrastructure/api/contabil/serviceInquiries'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import type { AccountingService, IntakeQuestion } from '@/shared/types/contabil'
import type { FormChangeEvent } from '@/shared/types/react-events'

const STATUS_LABELS: Record<string, string> = {
  LEAD_CAPTURED: 'Lead parcial',
  NEW: 'Novo',
  CONTACTED: 'Contactado',
  DOCS_REQUESTED: 'Aguarda documentos',
  IN_PROGRESS: 'Em progresso',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const STATUS_ORDER = ['LEAD_CAPTURED', 'NEW', 'CONTACTED', 'DOCS_REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED'])

/** Histórico (Fase 4) — reaproveita os eventos já escritos em audit_logs em cada
 * fase (1a/2a/2b/2c/3a), sem duplicar em nenhuma tabela nova. Só formatação. */
const HISTORY_ACTION_LABELS: Record<string, string> = {
  'service_inquiry.created': 'Solicitação criada',
  'service_inquiry.submitted': 'Formulário submetido pelo cliente',
  'service_inquiry.status_changed': 'Estado alterado',
  'service_inquiry.token_revoked': 'Link do cliente revogado',
  'service_inquiry.request_added': 'Pendência adicionada pela equipa',
  'service_inquiry.document_delivered': 'Documento recebido',
  'service_inquiry.request_answered': 'Resposta recebida do cliente',
}

function historyItemLabel(item: ServiceInquiryHistoryItem): string {
  const base = HISTORY_ACTION_LABELS[item.action] || item.action
  if (item.action === 'service_inquiry.status_changed') {
    const from = String(item.metadata?.from ?? '')
    const to = String(item.metadata?.to ?? '')
    const fromLabel = STATUS_LABELS[from] || from
    const toLabel = STATUS_LABELS[to] || to
    return `${base}: ${fromLabel} → ${toLabel}`
  }
  if (item.action === 'service_inquiry.request_added' && item.metadata?.title) {
    return `${base} — "${String(item.metadata.title)}"`
  }
  return base
}

function answerDisplay(question: IntakeQuestion | undefined, value: string | string[]) {
  if (!question?.options) return Array.isArray(value) ? value.join(', ') : String(value)
  const resolve = (v: string) => question.options?.find((o) => (o.id ?? o.label) === v)?.label ?? v
  return Array.isArray(value) ? value.map(resolve).join(', ') : resolve(value)
}

export function ServiceInquiriesWorkspace() {
  const qc = useQueryClient()
  const [serviceFilter, setServiceFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newRequestKind, setNewRequestKind] = useState<ServiceInquiryRequestKind>('question')
  const [newRequestTitle, setNewRequestTitle] = useState('')
  const [addingRequest, setAddingRequest] = useState(false)
  const [acceptingTag, setAcceptingTag] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  const leadId = detailQuery.data?.inquiry.leadId
  const clientId = detailQuery.data?.inquiry.clientId

  /** A Solicitação em si não guarda contacto — vem do Lead/Client associado.
   * Sem isto, um Lead novo (captado pela página pública, sem conta ainda)
   * fica sem nenhuma forma de a equipa ver o email/telefone para o contactar. */
  const leadQuery = useQuery({
    queryKey: ['service-inquiry-lead', leadId],
    queryFn: () => contabilLeadsApi.getById(leadId!),
    enabled: Boolean(leadId),
  })
  const clientContactQuery = useQuery({
    queryKey: ['service-inquiry-client-contact', clientId],
    queryFn: () => contabilClientsApi.getById(clientId!),
    enabled: Boolean(clientId),
  })
  const contact = leadId
    ? {
        email: leadQuery.data?.lead.email ?? null,
        phone: leadQuery.data?.lead.phone ?? null,
        taxId: leadQuery.data?.lead.taxId ?? null,
      }
    : clientId
      ? {
          email: (clientContactQuery.data as { email?: string | null } | undefined)?.email ?? null,
          phone: (clientContactQuery.data as { phone?: string | null } | undefined)?.phone ?? null,
          taxId: (clientContactQuery.data as { taxId?: string | null } | undefined)?.taxId ?? null,
        }
      : null

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

  const revokeToken = async () => {
    if (!selectedId) return
    if (!window.confirm('Revogar o link do cliente? Esta ação não pode ser desfeita — o cliente deixa de conseguir aceder à solicitação por esse link.')) {
      return
    }
    try {
      await contabilServiceInquiriesApi.revokeToken(selectedId)
      toast.success('Link revogado')
      await qc.invalidateQueries({ queryKey: ['service-inquiry-detail', selectedId] })
    } catch (err) {
      toast.error('Erro ao revogar link', { description: getErrorMessage(err) })
    }
  }

  const deleteInquiry = async () => {
    if (!selectedId) return
    if (
      !window.confirm(
        'Apagar esta solicitação? Esta ação não pode ser desfeita — o histórico, respostas e documentos entregues são todos removidos.',
      )
    ) {
      return
    }
    setDeleting(true)
    try {
      await contabilServiceInquiriesApi.remove(selectedId)
      toast.success('Solicitação apagada')
      setSelectedId(null)
      await qc.invalidateQueries({ queryKey: ['service-inquiries'] })
    } catch (err) {
      toast.error('Não foi possível apagar', { description: getErrorMessage(err) })
    } finally {
      setDeleting(false)
    }
  }

  const addRequest = async () => {
    if (!selectedId || !newRequestTitle.trim()) return
    setAddingRequest(true)
    try {
      await contabilServiceInquiriesApi.addRequest(selectedId, {
        kind: newRequestKind,
        title: newRequestTitle.trim(),
      })
      toast.success('Pendência adicionada — o cliente foi notificado')
      setNewRequestTitle('')
      await qc.invalidateQueries({ queryKey: ['service-inquiry-detail', selectedId] })
    } catch (err) {
      toast.error('Erro ao adicionar pendência', { description: getErrorMessage(err) })
    } finally {
      setAddingRequest(false)
    }
  }

  const acceptSuggestion = async (doc: { tag: string; title: string; instructions?: string | null }) => {
    if (!selectedId) return
    setAcceptingTag(doc.tag)
    try {
      await contabilServiceInquiriesApi.addRequest(selectedId, {
        kind: 'document',
        title: doc.title,
        instructions: doc.instructions || undefined,
        tag: doc.tag,
      })
      toast.success('Documento pedido — o cliente foi notificado')
      await qc.invalidateQueries({ queryKey: ['service-inquiry-detail', selectedId] })
    } catch (err) {
      toast.error('Erro ao pedir documento', { description: getErrorMessage(err) })
    } finally {
      setAcceptingTag(null)
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
                      item.status === 'LEAD_CAPTURED'
                        ? 'bg-amber-100 text-amber-900'
                        : TERMINAL_STATUSES.has(item.status)
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
                {contact && (contact.email || contact.phone || contact.taxId) ? (
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" /> {contact.email}
                      </a>
                    ) : null}
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" /> {contact.phone}
                      </a>
                    ) : null}
                    {contact.taxId ? <span>NIF {contact.taxId}</span> : null}
                  </div>
                ) : null}
              </div>

              {detailQuery.data.inquiry.consultation ? (
                <div className="rounded-lg border border-brand/30 bg-brand/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand">Consulta agendada</p>
                  <p className="text-sm font-medium">
                    {new Date(detailQuery.data.inquiry.consultation.scheduledAt).toLocaleString('pt-PT', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                      timeZone: 'Europe/Lisbon',
                    })}
                  </p>
                </div>
              ) : null}

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

              <div className="flex flex-wrap items-center gap-2">
                {detailQuery.data.inquiry.accessTokenRevokedAt ? (
                  <p className="text-xs text-muted-foreground">Link do cliente já revogado.</p>
                ) : (
                  <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => void revokeToken()}>
                    Revogar link do cliente
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deleting}
                  onClick={() => void deleteInquiry()}
                >
                  {deleting ? 'A apagar…' : 'Apagar solicitação'}
                </Button>
              </div>

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

              {detailQuery.data.suggestedDocuments.length > 0 ? (
                <div className="space-y-2 rounded-lg border border-amber-300/60 bg-amber-50/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                    Sugestões baseadas nas respostas
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Configurou estes documentos como "só sugerir depois" — ainda não foram pedidos ao cliente.
                  </p>
                  <ul className="space-y-2">
                    {detailQuery.data.suggestedDocuments.map((doc) => (
                      <li
                        key={doc.tag}
                        className="flex items-center justify-between gap-2 rounded-md border border-amber-300/50 bg-card p-2"
                      >
                        <span className="min-w-0 truncate text-sm">{doc.title}</span>
                        <Button
                          type="button"
                          size="sm"
                          className="shrink-0 rounded-full"
                          disabled={acceptingTag === doc.tag}
                          onClick={() => void acceptSuggestion(doc)}
                        >
                          {acceptingTag === doc.tag ? 'A pedir…' : 'Pedir este documento'}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pendências</p>
                {detailQuery.data.checklist.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem pendências para esta solicitação.</p>
                ) : (
                  <ul className="space-y-2">
                    {detailQuery.data.checklist.map((item: ServiceInquiryChecklistItem) => (
                      <li key={item.id} className="space-y-1 rounded-lg border border-border/40 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-sm">{item.title}</span>
                          {item.kind === 'document' ? (
                            item.received && item.documentId ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="shrink-0 rounded-full"
                                onClick={() => void downloadDocument(item.documentId!)}
                              >
                                <FileText className="mr-1.5 h-3.5 w-3.5" /> Ver
                              </Button>
                            ) : (
                              <span className="shrink-0 text-xs text-muted-foreground">Pendente</span>
                            )
                          ) : item.received ? (
                            <span className="shrink-0 text-xs font-semibold text-emerald-700">Respondido</span>
                          ) : (
                            <span className="shrink-0 text-xs text-muted-foreground">Aguarda resposta</span>
                          )}
                        </div>
                        {item.kind === 'question' && item.textReply ? (
                          <p className="rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">{item.textReply}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}

                {!TERMINAL_STATUSES.has(detailQuery.data.inquiry.status) ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border/50 p-2">
                    <select
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                      value={newRequestKind}
                      onChange={(e) => setNewRequestKind(e.target.value as ServiceInquiryRequestKind)}
                    >
                      <option value="question">Pergunta</option>
                      <option value="document">Documento</option>
                    </select>
                    <Input
                      className="h-9 min-w-[160px] flex-1 rounded-md text-sm"
                      placeholder="Ex.: Comprovativo de morada actualizado"
                      value={newRequestTitle}
                      onChange={(e: FormChangeEvent) => setNewRequestTitle(e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 rounded-full"
                      disabled={addingRequest || !newRequestTitle.trim()}
                      onClick={() => void addRequest()}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Pedir
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Histórico</p>
                {detailQuery.data.history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem eventos registados ainda.</p>
                ) : (
                  <ul className="space-y-2 border-l-2 border-border/40 pl-3">
                    {detailQuery.data.history.map((item: ServiceInquiryHistoryItem) => (
                      <li key={item.id} className="text-sm">
                        <p>{historyItemLabel(item)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}
                          {' · '}
                          {item.actorRole === 'PUBLIC' ? 'Cliente' : 'Equipa'}
                        </p>
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
