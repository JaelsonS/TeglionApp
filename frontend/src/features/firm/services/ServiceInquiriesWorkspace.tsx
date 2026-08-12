import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Inbox, Loader2, Mail, Phone, Plus, Settings2, Tag } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'
import { SheetHiddenTitle } from '@/shared/components/ui/sheet-hidden-title'
import {
  contabilAccountingServicesApi,
  contabilClientsApi,
  contabilInquiryTagsApi,
  contabilLeadsApi,
  contabilServiceInquiriesApi,
} from '@/infrastructure/api'
import type {
  ServiceInquiryChecklistItem,
  ServiceInquiryHistoryItem,
  ServiceInquiryRequestKind,
  ServiceInquiryTag,
} from '@/infrastructure/api/contabil/serviceInquiries'
import type { FirmInquiryTag } from '@/infrastructure/api/contabil/inquiryTags'
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

const SUGGESTED_TAG_COLORS = ['#0F2942', '#B45309', '#1B6B4A', '#9A3412', '#475569', '#854D0E']

const HISTORY_ACTION_LABELS: Record<string, string> = {
  'service_inquiry.created': 'Solicitação criada',
  'service_inquiry.submitted': 'Formulário submetido pelo cliente',
  'service_inquiry.status_changed': 'Estado alterado',
  'service_inquiry.token_revoked': 'Link do cliente revogado',
  'service_inquiry.request_added': 'Pendência adicionada pela equipa',
  'service_inquiry.document_delivered': 'Documento recebido',
  'service_inquiry.request_answered': 'Resposta recebida do cliente',
  'service_inquiry.consultation_confirmed': 'Agendamento confirmado e cliente notificado',
}

function historyItemLabel(item: ServiceInquiryHistoryItem): string {
  const base = HISTORY_ACTION_LABELS[item.action] || item.action
  if (item.action === 'service_inquiry.status_changed') {
    const from = String(item.metadata?.from ?? '')
    const to = String(item.metadata?.to ?? '')
    return `${base}: ${STATUS_LABELS[from] || from} → ${STATUS_LABELS[to] || to}`
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

function tagTextColor(hex: string) {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return '#fff'
  const r = parseInt(raw.slice(0, 2), 16)
  const g = parseInt(raw.slice(2, 4), 16)
  const b = parseInt(raw.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#0F172A' : '#FFFFFF'
}

function InquiryTagBadge({ tag }: { tag: ServiceInquiryTag | FirmInquiryTag }) {
  return (
    <span
      className="inline-flex max-w-[10rem] items-center truncate rounded-full px-2 py-0.5 text-caption font-semibold"
      style={{ backgroundColor: tag.colorHex, color: tagTextColor(tag.colorHex) }}
      title={tag.name}
    >
      {tag.name}
    </span>
  )
}

function formatSubmittedAt(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Lisbon',
  })
}

export function ServiceInquiriesWorkspace() {
  const qc = useQueryClient()
  const [serviceFilter, setServiceFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftKind, setDraftKind] = useState<ServiceInquiryRequestKind>('document')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftItems, setDraftItems] = useState<
    Array<{ key: string; kind: ServiceInquiryRequestKind; title: string; tag?: string; instructions?: string }>
  >([])
  const [sendingBatch, setSendingBatch] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(SUGGESTED_TAG_COLORS[0])
  const [savingTag, setSavingTag] = useState(false)
  const [savingInquiryTags, setSavingInquiryTags] = useState(false)
  const [confirmingBooking, setConfirmingBooking] = useState(false)

  useEffect(() => {
    setDraftItems([])
    setDraftTitle('')
    setDraftKind('document')
  }, [selectedId])

  const servicesQuery = useQuery({
    queryKey: ['contabil-accounting-services', 'all'],
    queryFn: () => contabilAccountingServicesApi.list(),
  })
  const services: AccountingService[] = servicesQuery.data?.items ?? []

  const tagsQuery = useQuery({
    queryKey: ['firm-inquiry-tags'],
    queryFn: () => contabilInquiryTagsApi.list(),
  })
  const firmTags = tagsQuery.data?.items ?? []

  const listQuery = useQuery({
    queryKey: ['service-inquiries', serviceFilter, tagFilter],
    queryFn: () =>
      contabilServiceInquiriesApi.list({
        ...(serviceFilter ? { serviceId: serviceFilter } : {}),
        ...(tagFilter ? { tagId: tagFilter } : {}),
      }),
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

  const invalidateLists = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['service-inquiries'] }),
      selectedId ? qc.invalidateQueries({ queryKey: ['service-inquiry-detail', selectedId] }) : Promise.resolve(),
    ])
  }

  const updateStatus = async (status: string) => {
    if (!selectedId) return
    try {
      await contabilServiceInquiriesApi.patch(selectedId, { status })
      toast.success('Estado actualizado')
      await invalidateLists()
    } catch (err) {
      toast.error('Erro ao actualizar estado', { description: getErrorMessage(err) })
    }
  }

  const revokeToken = async () => {
    if (!selectedId) return
    if (
      !window.confirm(
        'Revogar o link do cliente? Esta ação não pode ser desfeita — o cliente deixa de conseguir aceder à solicitação por esse link.',
      )
    ) {
      return
    }
    try {
      await contabilServiceInquiriesApi.revokeToken(selectedId)
      toast.success('Link revogado')
      await invalidateLists()
    } catch (err) {
      toast.error('Erro ao revogar link', { description: getErrorMessage(err) })
    }
  }

  const deleteInquiry = async () => {
    if (!selectedId) return
    if (!window.confirm('Apagar esta solicitação? Esta ação não pode ser desfeita.')) return
    setDeleting(true)
    try {
      await contabilServiceInquiriesApi.remove(selectedId)
      toast.success('Solicitação apagada')
      setSelectedId(null)
      await qc.invalidateQueries({ queryKey: ['service-inquiries'] })
    } catch (err) {
      toast.error('Erro ao apagar', { description: getErrorMessage(err) })
    } finally {
      setDeleting(false)
    }
  }

  const addDraftItem = () => {
    if (!draftTitle.trim()) return
    setDraftItems((prev) => [
      ...prev,
      {
        key: `draft-${Date.now()}-${prev.length}`,
        kind: draftKind,
        title: draftTitle.trim(),
      },
    ])
    setDraftTitle('')
  }

  const addSuggestionToDraft = (doc: { tag: string; title: string; instructions?: string | null }) => {
    setDraftItems((prev) => {
      if (prev.some((i) => i.tag === doc.tag)) return prev
      return [
        ...prev,
        {
          key: `sug-${doc.tag}`,
          kind: 'document' as const,
          title: doc.title,
          tag: doc.tag,
          instructions: doc.instructions || undefined,
        },
      ]
    })
    toast.success('Adicionado ao pedido')
  }

  const removeDraftItem = (key: string) => {
    setDraftItems((prev) => prev.filter((i) => i.key !== key))
  }

  const sendDraftBatch = async () => {
    if (!selectedId || draftItems.length === 0) return
    setSendingBatch(true)
    try {
      await contabilServiceInquiriesApi.addRequestsBatch(selectedId, {
        items: draftItems.map(({ kind, title, tag, instructions }) => ({
          kind,
          title,
          tag,
          instructions,
        })),
      })
      setDraftItems([])
      toast.success(
        draftItems.length > 1
          ? `${draftItems.length} pedidos enviados ao cliente`
          : 'Pedido enviado ao cliente',
      )
      await invalidateLists()
    } catch (err) {
      toast.error('Erro ao enviar pedido', { description: getErrorMessage(err) })
    } finally {
      setSendingBatch(false)
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

  const createTag = async () => {
    if (!newTagName.trim()) return
    setSavingTag(true)
    try {
      await contabilInquiryTagsApi.create({ name: newTagName.trim(), colorHex: newTagColor })
      setNewTagName('')
      toast.success('Etiqueta criada')
      await qc.invalidateQueries({ queryKey: ['firm-inquiry-tags'] })
    } catch (err) {
      toast.error('Não foi possível criar etiqueta', { description: getErrorMessage(err) })
    } finally {
      setSavingTag(false)
    }
  }

  const removeTag = async (tag: FirmInquiryTag) => {
    if (!window.confirm(`Apagar a etiqueta “${tag.name}”? Será removida das solicitações.`)) return
    try {
      await contabilInquiryTagsApi.remove(tag.id)
      if (tagFilter === tag.id) setTagFilter('')
      toast.success('Etiqueta apagada')
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['firm-inquiry-tags'] }),
        qc.invalidateQueries({ queryKey: ['service-inquiries'] }),
      ])
    } catch (err) {
      toast.error('Erro ao apagar etiqueta', { description: getErrorMessage(err) })
    }
  }

  const toggleInquiryTag = async (tagId: string) => {
    if (!selectedId || !detailQuery.data) return
    const current = new Set((detailQuery.data.inquiry.tags || []).map((t) => t.id))
    if (current.has(tagId)) current.delete(tagId)
    else current.add(tagId)
    setSavingInquiryTags(true)
    try {
      await contabilServiceInquiriesApi.patch(selectedId, { tagIds: [...current] })
      await invalidateLists()
    } catch (err) {
      toast.error('Erro ao actualizar etiquetas', { description: getErrorMessage(err) })
    } finally {
      setSavingInquiryTags(false)
    }
  }

  const confirmConsultation = async () => {
    if (!selectedId) return
    setConfirmingBooking(true)
    try {
      const result = await contabilServiceInquiriesApi.confirmConsultation(selectedId)
      toast.success(
        result.emailed
          ? 'Agendamento confirmado — email enviado ao cliente'
          : 'Agendamento confirmado (cliente sem email para notificar)',
      )
      await invalidateLists()
    } catch (err) {
      toast.error('Não foi possível confirmar', { description: getErrorMessage(err) })
    } finally {
      setConfirmingBooking(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Captação da página pública. Categorize com as suas etiquetas e peça o que faltar ao cliente.
        </p>
        <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setTagsOpen(true)}>
          <Settings2 className="mr-1.5 h-3.5 w-3.5" />
          Gerir etiquetas
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setServiceFilter('')
            setTagFilter('')
          }}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-semibold transition',
            !serviceFilter && !tagFilter ? 'bg-brand text-primary-foreground shadow-sm' : 'bg-muted/40 text-muted-foreground',
          )}
        >
          Todas
        </button>
        {firmTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => {
              setTagFilter(tag.id)
              setServiceFilter('')
            }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
              tagFilter === tag.id ? 'ring-2 ring-brand/40 ring-offset-1' : 'opacity-90 hover:opacity-100',
            )}
            style={{ backgroundColor: tag.colorHex, color: tagTextColor(tag.colorHex) }}
          >
            <Tag className="h-3 w-3 opacity-80" />
            {tag.name}
          </button>
        ))}
        {services.slice(0, 8).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setServiceFilter(s.id)
              setTagFilter('')
            }}
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
          <p className="text-sm text-muted-foreground">Ainda sem solicitações com estes filtros.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/50">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 border-b border-border/40 bg-muted/30 px-3 py-2 text-caption font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[1.2fr_1fr_auto_auto_auto]">
            <span>Cliente</span>
            <span className="hidden sm:block">Serviço</span>
            <span className="hidden md:block">Etiquetas</span>
            <span>Data</span>
            <span>Estado</span>
          </div>
          <ul className="divide-y divide-border/40">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="grid w-full grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-3 py-3 text-left hover:bg-muted/20 sm:grid-cols-[1.2fr_1fr_auto_auto_auto]"
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className="min-w-0 truncate text-sm font-medium">{item.requesterName || 'Sem nome'}</span>
                  <span className="hidden min-w-0 truncate text-xs text-muted-foreground sm:block">
                    {item.serviceName || '—'}
                  </span>
                  <span className="hidden max-w-[12rem] flex-wrap justify-end gap-1 md:flex">
                    {(item.tags || []).slice(0, 3).map((t) => (
                      <InquiryTagBadge key={t.id} tag={t} />
                    ))}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatSubmittedAt(item.submittedAt || item.createdAt)}
                  </span>
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

      <Sheet open={tagsOpen} onOpenChange={setTagsOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHiddenTitle>Gerir etiquetas</SheetHiddenTitle>
          <div className="space-y-5 py-4">
            <div>
              <h2 className="text-lg font-bold">Etiquetas das solicitações</h2>
              <div className="mt-2 space-y-2 rounded-xl border border-sky-200/80 bg-sky-50/80 px-3 py-3 text-sm text-sky-950">
                <p className="font-medium text-brand">Para que servem?</p>
                <p>
                  São <strong>rótulos da equipa</strong> para organizar pedidos (ex.: «Urgente», «Fácil»,
                  «Agendar»). Não são vistas pelo cliente.
                </p>
                <p>
                  Depois de criar, abra uma solicitação e marque as etiquetas. Pode filtrar a lista por
                  etiqueta.
                </p>
                <p className="text-xs text-sky-900/80">
                  Em breve: regras automáticas no Catálogo («se o cliente responder X → aplicar esta
                  etiqueta»).
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Cor ${c}`}
                  onClick={() => setNewTagColor(c)}
                  className={cn('h-7 w-7 rounded-full border-2', newTagColor === c ? 'border-foreground' : 'border-transparent')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                className="h-10 rounded-xl"
                placeholder="Ex.: Atenção, Fácil, Agendamento…"
                value={newTagName}
                onChange={(e: FormChangeEvent) => setNewTagName(e.target.value)}
              />
              <Button type="button" className="shrink-0 rounded-full" disabled={savingTag || !newTagName.trim()} onClick={() => void createTag()}>
                {savingTag ? '…' : 'Criar'}
              </Button>
            </div>
            <ul className="space-y-2">
              {firmTags.map((tag) => (
                <li key={tag.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2">
                  <InquiryTagBadge tag={tag} />
                  <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => void removeTag(tag)}>
                    Apagar
                  </Button>
                </li>
              ))}
              {!firmTags.length ? <p className="text-sm text-muted-foreground">Ainda sem etiquetas — crie a primeira acima.</p> : null}
            </ul>
          </div>
        </SheetContent>
      </Sheet>

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
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Recebido {formatSubmittedAt(detailQuery.data.inquiry.submittedAt || detailQuery.data.inquiry.createdAt)}
                </p>
                {contact && (contact.email || contact.phone || contact.taxId) ? (
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1 hover:text-foreground hover:underline">
                        <Mail className="h-3.5 w-3.5" /> {contact.email}
                      </a>
                    ) : null}
                    {contact.phone ? (
                      <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1 hover:text-foreground hover:underline">
                        <Phone className="h-3.5 w-3.5" /> {contact.phone}
                      </a>
                    ) : null}
                    {contact.taxId ? <span>NIF {contact.taxId}</span> : null}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etiquetas</p>
                <div className="flex flex-wrap gap-2">
                  {firmTags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Crie etiquetas em “Gerir etiquetas”.</p>
                  ) : (
                    firmTags.map((tag) => {
                      const active = (detailQuery.data?.inquiry.tags || []).some((t) => t.id === tag.id)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          disabled={savingInquiryTags}
                          onClick={() => void toggleInquiryTag(tag.id)}
                          className={cn(
                            'rounded-full px-2.5 py-1 text-caption font-semibold transition',
                            active ? 'ring-2 ring-offset-1 ring-brand/50' : 'opacity-55 hover:opacity-100',
                          )}
                          style={{ backgroundColor: tag.colorHex, color: tagTextColor(tag.colorHex) }}
                        >
                          {tag.name}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {detailQuery.data.inquiry.consultation ? (
                <div className="space-y-3 rounded-lg border border-brand/30 bg-brand/5 p-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">Consulta agendada</p>
                    <p className="text-sm font-medium">
                      {new Date(detailQuery.data.inquiry.consultation.scheduledAt).toLocaleString('pt-PT', {
                        dateStyle: 'full',
                        timeStyle: 'short',
                        timeZone: 'Europe/Lisbon',
                      })}
                    </p>
                  </div>
                  {!TERMINAL_STATUSES.has(detailQuery.data.inquiry.status) &&
                  detailQuery.data.inquiry.consultation.status !== 'CANCELLED' ? (
                    <Button
                      type="button"
                      className="rounded-full"
                      disabled={confirmingBooking}
                      onClick={() => void confirmConsultation()}
                    >
                      {confirmingBooking ? 'A confirmar…' : 'Confirmar agendamento'}
                    </Button>
                  ) : null}
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Sugestões baseadas nas respostas</p>
                  <p className="text-xs text-muted-foreground">
                    Adicione ao pedido abaixo e envie tudo de uma vez ao cliente.
                  </p>
                  <ul className="space-y-2">
                    {detailQuery.data.suggestedDocuments.map((doc) => {
                      const already = draftItems.some((i) => i.tag === doc.tag)
                      return (
                        <li
                          key={doc.tag}
                          className="flex items-center justify-between gap-2 rounded-md border border-amber-300/50 bg-card p-2"
                        >
                          <span className="min-w-0 truncate text-sm">{doc.title}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant={already ? 'secondary' : 'outline'}
                            className="shrink-0 rounded-full"
                            disabled={already}
                            onClick={() => addSuggestionToDraft(doc)}
                          >
                            {already ? 'No pedido' : 'Adicionar'}
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pendências</p>
                {detailQuery.data.checklist.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem pendências enviadas ainda.</p>
                ) : (
                  <ul className="space-y-2">
                    {detailQuery.data.checklist.map((item: ServiceInquiryChecklistItem) => (
                      <li key={item.id} className="space-y-1 rounded-lg border border-border/40 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-sm">
                            <span className="mr-1.5 text-caption font-semibold uppercase text-muted-foreground">
                              {item.kind === 'document' ? 'Doc' : 'Pergunta'}
                            </span>
                            {item.title}
                          </span>
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
                  <div className="space-y-3 rounded-lg border border-dashed border-border/50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Pedir ao cliente
                    </p>
                    {draftItems.length > 0 ? (
                      <ul className="space-y-1.5">
                        {draftItems.map((item) => (
                          <li
                            key={item.key}
                            className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/20 px-2.5 py-1.5"
                          >
                            <span className="min-w-0 truncate text-sm">
                              <span className="mr-1.5 text-caption font-semibold uppercase text-muted-foreground">
                                {item.kind === 'document' ? 'Doc' : 'Pergunta'}
                              </span>
                              {item.title}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 shrink-0 px-2 text-xs text-muted-foreground"
                              onClick={() => removeDraftItem(item.key)}
                            >
                              Remover
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Adicione documentos e perguntas; o cliente recebe um único email com tudo.
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={draftKind}
                        onChange={(e) => setDraftKind(e.target.value as ServiceInquiryRequestKind)}
                      >
                        <option value="document">Documento</option>
                        <option value="question">Pergunta</option>
                      </select>
                      <Input
                        className="h-9 min-w-[160px] flex-1 rounded-md text-sm"
                        placeholder={
                          draftKind === 'document'
                            ? 'Ex.: Certidão de casamento'
                            : 'Ex.: Qual o NIF do cônjuge?'
                        }
                        value={draftTitle}
                        onChange={(e: FormChangeEvent) => setDraftTitle(e.target.value)}
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addDraftItem()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="shrink-0 rounded-full"
                        disabled={!draftTitle.trim()}
                        onClick={addDraftItem}
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar
                      </Button>
                    </div>
                    <Button
                      type="button"
                      className="w-full rounded-full sm:w-auto"
                      disabled={sendingBatch || draftItems.length === 0}
                      onClick={() => void sendDraftBatch()}
                    >
                      {sendingBatch
                        ? 'A enviar…'
                        : draftItems.length > 1
                          ? `Enviar pedido ao cliente (${draftItems.length})`
                          : 'Enviar pedido ao cliente'}
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
