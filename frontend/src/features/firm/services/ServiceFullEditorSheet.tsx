import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  FileQuestion,
  Globe,
  ImageIcon,
  Info,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { ServiceFormPreview } from '@/features/firm/agenda/ServiceFormPreview'
import {
  ServicePaymentMethodsPanel,
  type ServicePaymentMethodId,
} from '@/features/firm/services/ServicePaymentMethodsPanel'
import { getServicePublishPresentation } from '@/features/firm/services/servicePublishState'
import { AskMayaButton } from '@/features/maya'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog'
import { DurationMinutesField, EuroInput, RichTextEditor, UploadDropzone } from '@/shared/design-system'
import { ImageCropDialog } from '@/shared/components/media/ImageCropDialog'
import { useAuth } from '@/shared/hooks/useAuth'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { PRICE_TAX_MODE_LABELS, type PriceTaxMode } from '@/shared/utils/priceTaxMode'
import { cn } from '@/shared/lib/utils'
import type {
  AccountingService,
  DocumentRequirement,
  DocumentTiming,
  IntakeForm,
  IntakeQuestion,
  IntakeQuestionOption,
  IntakeQuestionType,
  IrsServiceConfig,
} from '@/shared/types/contabil'
import type { FormChangeEvent } from '@/shared/types/react-events'

type PaymentMethod = ServicePaymentMethodId

const QUESTION_TYPE_LABELS: Record<IntakeQuestionType, string> = {
  text: 'Texto livre',
  email: 'Email',
  phone: 'Telefone',
  tax_id: 'NIF',
  date: 'Data',
  single_choice: 'Escolha única',
  multiple_choice: 'Escolha múltipla',
  yes_no: 'Sim / Não',
}

const CHOICE_TYPES: IntakeQuestionType[] = ['single_choice', 'multiple_choice', 'yes_no']

const TABS = [
  { id: 'geral', label: '1. O que oferece', short: 'Oferta' },
  { id: 'banner', label: '2. Imagem', short: 'Imagem' },
  { id: 'formulario', label: '3. Como solicita', short: 'Pedido' },
  { id: 'publicacao', label: '4. Publicação', short: 'Publicar' },
  { id: 'preview', label: 'Pré-visualização', short: 'Ver' },
] as const

type TabId = (typeof TABS)[number]['id']

/**
 * ID estável — gerado uma única vez na criação da pergunta/opção, nunca
 * recalculado a partir do texto. Editar o texto depois de guardado não pode
 * desalinhar as respostas já submetidas em `service_inquiries.answers`.
 */
function generateStableId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}${random}`
}

/** Nome/Email/Telefone/NIF já são pedidos automaticamente no topo da página
 * pública (identificam o Lead/Client) — repeti-los como pergunta duplica o
 * campo para o cliente. Comparação normalizada para apanhar variações como
 * "Telemóvel" ou "N.I.F.". */
const RESERVED_QUESTION_LABELS = new Set([
  'nome',
  'email',
  'e-mail',
  'telefone',
  'telemovel',
  'contacto',
  'nif',
  'contribuinte',
])

function normalizeLabelForComparison(label: string) {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function isReservedQuestionLabel(label: string) {
  return RESERVED_QUESTION_LABELS.has(normalizeLabelForComparison(label))
}

function slugifyTag(title: string, index: number) {
  const base = title
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return base || `documento_${index + 1}`
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-brand/15 bg-card shadow-sm">
      <div className="border-b border-brand/10 bg-brand/[0.04] px-4 py-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </section>
  )
}

type Props = {
  service: AccountingService | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  /** Semente ao criar a partir de um modelo Teglion (depois de activar, passe o serviço criado). */
  initialCatalogHint?: { name?: string; catalogKey?: string } | null
}

export function ServiceFullEditorSheet({
  service,
  open,
  onOpenChange,
  onSaved,
  initialCatalogHint,
}: Props) {
  const isCreate = !service
  const { user } = useAuth()
  const firmSlug = user?.tenant?.slug

  const [tab, setTab] = useState<TabId>('geral')

  const [name, setName] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [priceEuros, setPriceEuros] = useState(0)
  const [priceTaxMode, setPriceTaxMode] = useState<PriceTaxMode | ''>('')
  const [description, setDescription] = useState('')
  const [descOpen, setDescOpen] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const [paymentRequired, setPaymentRequired] = useState(false)
  const [requiresBooking, setRequiresBooking] = useState(false)

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageStorageKey, setImageStorageKey] = useState<string | null>(null)
  /** Só enviamos campos de imagem quando o escritório mexeu neles — reenviar
   * o `imageUrl` devolvido pela API gravaria uma URL assinada temporária. */
  const [imageDirty, setImageDirty] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)

  const [slug, setSlug] = useState('')
  const [isPubliclyListed, setIsPubliclyListed] = useState(false)

  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([])
  const [questions, setQuestions] = useState<IntakeQuestion[]>([])
  const [formEnabled, setFormEnabled] = useState(false)
  const [showFirmLogo, setShowFirmLogo] = useState(true)
  const [newDocDraft, setNewDocDraft] = useState<Record<string, string>>({})
  const [irsConfig, setIrsConfig] = useState<IrsServiceConfig | undefined>(undefined)

  const [saving, setSaving] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Campo primitivo em vez do objecto: um `initialCatalogHint` inline no
  // chamador mudaria de identidade a cada render e reiniciaria o formulário
  // a meio da escrita.
  const catalogHintName = initialCatalogHint?.name

  useEffect(() => {
    if (!open) return
    setTab('geral')
    setNewDocDraft({})
    setImageDirty(false)
    if (service) {
      const form = service.intakeForm
      const serviceQuestions = form?.questions ?? []
      setName(service.name)
      setDurationMinutes(service.durationMinutes || 60)
      setPriceEuros((service.priceCents || 0) / 100)
      setPriceTaxMode(service.priceTaxMode === 'included' || service.priceTaxMode === 'excluded' ? service.priceTaxMode : '')
      setDescription(service.description || '')
      setDescOpen(Boolean(service.description?.replace(/<[^>]+>/g, '').trim()))
      setIsActive(service.isActive !== false)
      setPaymentMethod(service.paymentMethod || 'bank_transfer')
      setPaymentRequired(Boolean(service.paymentRequired))
      setRequiresBooking(Boolean(service.requiresBooking))
      setImageUrl(service.imageUrl ?? null)
      setImageStorageKey(service.imageStorageKey ?? null)
      setSlug(service.slug || '')
      setIsPubliclyListed(Boolean(service.isPubliclyListed))
      setDocumentRequirements(service.documentRequirements ?? [])
      setQuestions(serviceQuestions)
      setFormEnabled(serviceQuestions.length > 0)
      setShowFirmLogo(form?.pageOptions?.showFirmLogo !== false)
      setIrsConfig(form?.irsConfig)
    } else {
      setName(catalogHintName || '')
      setDurationMinutes(60)
      setPriceEuros(0)
      setPriceTaxMode('')
      setDescription('')
      setDescOpen(false)
      setIsActive(true)
      setPaymentMethod('bank_transfer')
      setRequiresBooking(false)
      setImageUrl(null)
      setImageStorageKey(null)
      setSlug('')
      setIsPubliclyListed(false)
      setDocumentRequirements([])
      setQuestions([])
      setFormEnabled(false)
      setShowFirmLogo(true)
      setIrsConfig(undefined)
    }
  }, [open, service, catalogHintName])

  const effectiveQuestions = useMemo(
    () => (formEnabled ? questions : []),
    [formEnabled, questions],
  )

  const draftIntakeForm: IntakeForm = useMemo(
    () => ({
      questions: effectiveQuestions,
      pageOptions: { showFirmLogo },
      ...(irsConfig ? { irsConfig } : {}),
    }),
    [effectiveQuestions, showFirmLogo, irsConfig],
  )

  const publicUrl =
    firmSlug && slug.trim()
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${encodeURIComponent(firmSlug)}/servicos/${encodeURIComponent(slug.trim())}`
      : null

  /* ---------- documentos exigidos ---------- */

  const addRequirement = () => {
    setDocumentRequirements((prev) => [
      ...prev,
      { tag: `documento_${prev.length + 1}`, title: '', instructions: '', timing: 'immediate' },
    ])
  }

  const updateRequirement = (index: number, patch: Partial<DocumentRequirement>) => {
    setDocumentRequirements((prev) =>
      prev.map((req, i) => {
        if (i !== index) return req
        const merged = { ...req, ...patch }
        // A tag é um identificador interno derivado do título, não editável aqui.
        if (patch.title !== undefined) merged.tag = slugifyTag(merged.title, index)
        return merged
      }),
    )
  }

  const removeRequirement = (index: number) => {
    setDocumentRequirements((prev) => prev.filter((_, i) => i !== index))
  }

  /* ---------- perguntas ---------- */

  const addQuestion = () => {
    setFormEnabled(true)
    setQuestions((prev) => [
      ...prev,
      { id: generateStableId('q_'), label: '', type: 'text', required: false },
    ])
  }

  const updateQuestion = (index: number, patch: Partial<IntakeQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== index) return q
        const merged: IntakeQuestion = { ...q, ...patch }
        if (patch.type !== undefined) {
          if (CHOICE_TYPES.includes(patch.type)) {
            merged.options =
              patch.type === 'yes_no'
                ? [
                    { id: 'sim', label: 'Sim', documentTags: [] },
                    { id: 'nao', label: 'Não', documentTags: [] },
                  ]
                : q.options && q.options.length
                  ? q.options
                  : [{ id: generateStableId('o_'), label: '', documentTags: [] }]
          } else {
            delete merged.options
          }
        }
        return merged
      }),
    )
  }

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  const addOption = (qIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i !== qIndex
          ? q
          : { ...q, options: [...(q.options ?? []), { id: generateStableId('o_'), label: '', documentTags: [] }] },
      ),
    )
  }

  const updateOption = (qIndex: number, oIndex: number, patch: Partial<IntakeQuestionOption>) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q
        return { ...q, options: (q.options ?? []).map((o, oi) => (oi === oIndex ? { ...o, ...patch } : o)) }
      }),
    )
  }

  const removeOption = (qIndex: number, oIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i !== qIndex ? q : { ...q, options: (q.options ?? []).filter((_, oi) => oi !== oIndex) },
      ),
    )
  }

  const toggleOptionDocumentTag = (qIndex: number, oIndex: number, tag: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q
        const options = (q.options ?? []).map((o, oi) => {
          if (oi !== oIndex) return o
          const has = o.documentTags.includes(tag)
          return { ...o, documentTags: has ? o.documentTags.filter((t) => t !== tag) : [...o.documentTags, tag] }
        })
        return { ...q, options }
      }),
    )
  }

  const docDraftKey = (qIndex: number, oIndex: number) => `${qIndex}:${oIndex}`

  /**
   * Cria o documento exigido a partir da própria opção (ex.: escrever
   * "Comprovativo de morada" na opção "Sim") — em vez de obrigar a declarar
   * o documento noutro sítio e só depois voltar aqui para o ligar.
   */
  const addRequirementFromOption = (qIndex: number, oIndex: number, rawTitle: string) => {
    const title = rawTitle.trim()
    if (!title) return
    const tag = slugifyTag(title, documentRequirements.length)
    setDocumentRequirements((prev) => [...prev, { tag, title, instructions: '', timing: 'immediate' }])
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q
        const options = (q.options ?? []).map((o, oi) =>
          oi !== oIndex ? o : { ...o, documentTags: [...o.documentTags, tag] },
        )
        return { ...q, options }
      }),
    )
    setNewDocDraft((prev) => {
      const next = { ...prev }
      delete next[docDraftKey(qIndex, oIndex)]
      return next
    })
  }

  /* ---------- imagem ---------- */

  const uploadBanner = (files: File[]) => {
    const file = files[0]
    if (!file) return
    setCropFile(file)
    setCropOpen(true)
  }

  const uploadCroppedBanner = (file: File) => {
    setUploading(true)
    void (async () => {
      try {
        const res = await contabilAccountingServicesApi.uploadImage(file)
        setImageStorageKey(res.storageKey)
        setImageUrl(res.previewUrl)
        setImageDirty(true)
        toast.success('Imagem carregada — guarde o serviço para aplicar')
      } catch (err) {
        toast.error('Não foi possível carregar a imagem', { description: getErrorMessage(err) })
      } finally {
        setUploading(false)
      }
    })()
  }

  const removeBanner = () => {
    setImageStorageKey(null)
    setImageUrl(null)
    setImageDirty(true)
  }

  /* ---------- guardar / duplicar / apagar ---------- */

  const save = async () => {
    if (!name.trim()) {
      toast.error('Indique o nome do serviço')
      return
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes < 15 || durationMinutes > 480) {
      toast.error('Duração inválida', { description: 'Use um valor entre 15 e 480 minutos.' })
      return
    }
    const reserved = effectiveQuestions.map((q) => q.label).filter(isReservedQuestionLabel)
    if (reserved.length > 0) {
      toast.error('Perguntas duplicadas no formulário', {
        description: `"${reserved.join('", "')}" já ${reserved.length > 1 ? 'são pedidos' : 'é pedido'} automaticamente no topo da página — apague ou renomeie antes de guardar.`,
      })
      return
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      description: description || null,
      durationMinutes,
      priceEuros,
      priceTaxMode: priceTaxMode || null,
      isActive,
      requiresBooking,
      slug: slug.trim() || null,
      isPubliclyListed,
      paymentMethod: paymentRequired ? 'stripe_connect' : paymentMethod,
      paymentRequired,
      documentRequirements,
      intakeForm: draftIntakeForm,
      ...(isCreate || imageDirty ? { imageStorageKey } : {}),
      ...(isCreate && initialCatalogHint?.catalogKey ? { catalogKey: initialCatalogHint.catalogKey } : {}),
    }

    setSaving(true)
    try {
      if (isCreate) {
        await contabilAccountingServicesApi.create(payload)
        toast.success('Serviço criado')
      } else {
        await contabilAccountingServicesApi.patch(service!.id, payload)
        toast.success('Serviço guardado')
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const duplicateService = async () => {
    if (!service) return
    setDuplicating(true)
    try {
      await contabilAccountingServicesApi.duplicate(service.id)
      toast.success(`"${service.name}" duplicado — o duplicado nasce privado, edite o nome antes de publicar`)
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error('Não foi possível duplicar', { description: getErrorMessage(err) })
    } finally {
      setDuplicating(false)
    }
  }

  const deleteService = async () => {
    if (!service) return
    setDeleting(true)
    try {
      await contabilAccountingServicesApi.remove(service.id)
      toast.success(`"${service.name}" apagado`)
      setDeleteOpen(false)
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error('Não foi possível apagar', { description: getErrorMessage(err) })
    } finally {
      setDeleting(false)
    }
  }

  const headerTitle = name.trim() || (isCreate ? 'Novo serviço' : service!.name)
  const publishState = getServicePublishPresentation({
    isActive,
    isPubliclyListed,
    slug,
  })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex max-h-[min(92dvh,calc(100dvh-1.5rem))] w-[calc(100vw-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border border-brand/20 p-0 shadow-xl sm:max-w-5xl"
        >
          <DialogTitle className="sr-only">{headerTitle}</DialogTitle>

          <div className="shrink-0 border-b border-brand/15 bg-card px-5 pb-0 pr-12 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand/80">
                  Serviços › {isCreate ? 'Criar' : 'Editar'}
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{headerTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure o que oferece, como o cliente solicita, e publique na página pública.
                </p>
              </div>
              <AskMayaButton intentId="service" />
            </div>
            <p
              className={cn(
                'mt-2 text-sm',
                publishState.id === 'published'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : publishState.id === 'inactive'
                    ? 'text-muted-foreground'
                    : 'text-amber-800 dark:text-amber-400',
              )}
              data-testid="service-editor-publish-state"
            >
              <span className="font-semibold">{publishState.label}.</span> {publishState.description}
            </p>
            <div className="mt-3 flex gap-1 overflow-x-auto pb-2" role="tablist" aria-label="Passos do serviço">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                    tab === t.id
                      ? 'bg-brand text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-brand/[0.06] hover:text-foreground',
                  )}
                >
                  <span className="sm:hidden">{t.short}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-4 py-4 sm:px-5">
            {/* ------------------------------- Geral ------------------------------- */}
            {tab === 'geral' ? (
              <div className="space-y-4">
                <SectionCard title="Sobre o serviço" description="Nome, duração e preço que o cliente vê.">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="space-y-1 text-sm sm:col-span-3">
                      <span className="font-medium">Nome *</span>
                      <Input
                        value={name}
                        onChange={(e: FormChangeEvent) => setName(e.target.value)}
                        className="rounded-xl border-brand/20 bg-card"
                        placeholder="Ex.: Consultoria fiscal"
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Duração (min)</span>
                      <DurationMinutesField value={durationMinutes} onChange={setDurationMinutes} />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Preço</span>
                      <EuroInput value={priceEuros} onChange={setPriceEuros} />
                    </label>
                    <label className="space-y-1 text-sm sm:col-span-3">
                      <span className="font-medium">Texto do IVA (página pública)</span>
                      <select
                        className="flex h-10 w-full rounded-xl border border-brand/20 bg-card px-3 text-sm"
                        value={priceTaxMode}
                        onChange={(e) => setPriceTaxMode((e.target.value as PriceTaxMode | '') || '')}
                      >
                        <option value="">Sem frase de IVA</option>
                        <option value="included">{PRICE_TAX_MODE_LABELS.included}</option>
                        <option value="excluded">{PRICE_TAX_MODE_LABELS.excluded}</option>
                      </select>
                      <span className="block text-xs text-muted-foreground">
                        Só aparece sob o preço na página pública — não altera o pagamento Stripe.
                      </span>
                    </label>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={isActive}
                          onCheckedChange={(checked: boolean | 'indeterminate') => setIsActive(Boolean(checked))}
                        />
                        Serviço activo
                      </label>
                    </div>
                  </div>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox
                      className="mt-0.5"
                      checked={requiresBooking}
                      onCheckedChange={(checked: boolean | 'indeterminate') => setRequiresBooking(Boolean(checked))}
                    />
                    <span>
                      Exige agendamento
                      <span className="block text-xs text-muted-foreground">
                        O cliente escolhe um horário disponível do escritório na página pública.
                      </span>
                    </span>
                  </label>
                </SectionCard>

                <section className="overflow-hidden rounded-2xl border border-brand/15 bg-card shadow-sm">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                    onClick={() => setDescOpen((v) => !v)}
                  >
                    <span>
                      <span className="text-base font-semibold text-foreground">Descrição</span>
                      <span className="block text-xs text-muted-foreground">
                        Texto apresentado na página pública do serviço.
                      </span>
                    </span>
                    {descOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {descOpen ? (
                    <div className="border-t border-brand/10 p-4">
                      <RichTextEditor
                        value={description}
                        onChange={setDescription}
                        placeholder="Descrição que o cliente vê na página pública…"
                      />
                    </div>
                  ) : (
                    <p className="border-t border-brand/10 px-4 py-2.5 text-xs text-muted-foreground">
                      {description.replace(/<[^>]+>/g, '').trim()
                        ? 'Há texto guardado — abra para editar.'
                        : 'Sem descrição. Abra para escrever o que o cliente vê.'}
                    </p>
                  )}
                </section>

                <SectionCard title="Pagamento" description="Meios que o cliente pode usar neste serviço.">
                  <ServicePaymentMethodsPanel
                    paymentMethod={paymentMethod}
                    paymentRequired={paymentRequired}
                    requiresBooking={requiresBooking}
                    onPaymentMethodChange={setPaymentMethod}
                    onPaymentRequiredChange={setPaymentRequired}
                  />
                </SectionCard>
              </div>
            ) : null}

            {/* ------------------------------- Banner ------------------------------ */}
            {tab === 'banner' ? (
              <SectionCard
                title="Imagem / banner"
                description="Aparece na página pública do serviço e no cartão do serviço."
              >
                {imageUrl ? (
                  <div className="relative overflow-hidden rounded-xl border border-brand/20">
                    <img src={imageUrl} alt="" className="max-h-56 w-full object-cover" />
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full bg-card/90 px-3 py-1 text-xs font-medium shadow-sm"
                      onClick={removeBanner}
                    >
                      Remover imagem
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-dashed border-brand/20 px-3 py-4 text-xs text-muted-foreground">
                    <ImageIcon className="h-4 w-4 shrink-0 opacity-60" />
                    Sem imagem — a página pública mostra só o texto.
                  </div>
                )}
                <UploadDropzone
                  multiple={false}
                  accept="image/*"
                  loading={uploading}
                  label="Arrastar imagem ou clicar"
                  hint="JPG, PNG ou WebP — aparece na página pública do serviço"
                  onFiles={uploadBanner}
                />
                <div className="flex gap-2 rounded-xl border border-sky-200/80 bg-sky-50 px-3 py-2.5 text-xs text-sky-950">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  <p>A imagem só é aplicada depois de guardar o serviço.</p>
                </div>
              </SectionCard>
            ) : null}

            {/* ----------------------------- Formulário ---------------------------- */}
            {tab === 'formulario' ? (
              <div className="space-y-4">
                <SectionCard
                  title="Documentos necessários"
                  description="Documentos que este serviço pede ao cliente. Podem ser pedidos logo ou ficar como sugestão."
                >
                  {documentRequirements.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum documento configurado ainda.</p>
                  ) : (
                    <div className="space-y-2">
                      {documentRequirements.map((req, index) => (
                        <div
                          key={index}
                          className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 p-2"
                        >
                          <Input
                            placeholder="Nome do documento"
                            className="h-9 min-w-[160px] flex-1 rounded-lg text-sm"
                            value={req.title}
                            onChange={(e: FormChangeEvent) => updateRequirement(index, { title: e.target.value })}
                          />
                          <Input
                            placeholder="Instruções (opcional)"
                            className="h-9 min-w-[160px] flex-1 rounded-lg text-sm"
                            value={req.instructions ?? ''}
                            onChange={(e: FormChangeEvent) =>
                              updateRequirement(index, { instructions: e.target.value })
                            }
                          />
                          <select
                            className="h-9 shrink-0 rounded-lg border border-brand/20 bg-background px-2 text-xs"
                            value={req.timing ?? 'immediate'}
                            onChange={(e) =>
                              updateRequirement(index, { timing: e.target.value as DocumentTiming })
                            }
                          >
                            <option value="immediate">Pedir logo</option>
                            <option value="manual">Só sugerir depois</option>
                          </select>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 shrink-0 rounded-full"
                            aria-label="Remover documento"
                            onClick={() => removeRequirement(index)}
                          >
                            <Trash2 className="h-3.5 w-3.5 opacity-60" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="max-w-xl text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Pedir logo</span> — este documento é pedido ao
                      cliente assim que ele submete o formulário.{' '}
                      <span className="font-medium text-foreground">Só sugerir depois</span> — o documento aparece
                      como sugestão na solicitação e só é pedido quando o escritório o decidir.
                    </p>
                    <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={addRequirement}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar documento
                    </Button>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Formulário de perguntas"
                  description="Nome, email, telefone e NIF já são pedidos automaticamente no topo da página pública — use este formulário só para perguntas próprias deste serviço."
                >
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox
                      className="mt-0.5"
                      checked={formEnabled}
                      onCheckedChange={(checked: boolean | 'indeterminate') => setFormEnabled(Boolean(checked))}
                    />
                    <span>
                      Incluir formulário de perguntas
                      <span className="block text-xs text-muted-foreground">
                        Se desligar, o serviço é guardado sem perguntas — a página pede apenas nome e contacto.
                      </span>
                    </span>
                  </label>

                  {formEnabled ? (
                    questions.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-brand/20 px-4 py-8 text-center">
                        <FileQuestion className="h-7 w-7 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                          Ainda sem perguntas. Adicione a primeira (ex.: “É casado(a)?”).
                        </p>
                        <Button type="button" size="sm" className="rounded-full bg-brand" onClick={addQuestion}>
                          <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar pergunta
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {questions.map((q, qIndex) => (
                          <div key={q.id ?? qIndex} className="space-y-2 rounded-xl border border-border/50 p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Input
                                placeholder="Pergunta"
                                className="h-9 min-w-[180px] flex-1 rounded-lg text-sm"
                                value={q.label}
                                onChange={(e: FormChangeEvent) => updateQuestion(qIndex, { label: e.target.value })}
                              />
                              <select
                                className="h-9 rounded-lg border border-brand/20 bg-background px-2 text-sm"
                                value={q.type}
                                onChange={(e) =>
                                  updateQuestion(qIndex, { type: e.target.value as IntakeQuestionType })
                                }
                              >
                                {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Checkbox
                                  checked={q.required}
                                  onCheckedChange={(checked: boolean | 'indeterminate') =>
                                    updateQuestion(qIndex, { required: Boolean(checked) })
                                  }
                                />
                                Obrigatória
                              </label>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 shrink-0 rounded-full"
                                aria-label="Remover pergunta"
                                onClick={() => removeQuestion(qIndex)}
                              >
                                <Trash2 className="h-3.5 w-3.5 opacity-60" />
                              </Button>
                            </div>

                            {isReservedQuestionLabel(q.label) ? (
                              <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-800">
                                “{q.label}” já é pedido automaticamente no topo da página — vai aparecer duplicado ao
                                cliente. Apague esta pergunta ou mude o nome.
                              </p>
                            ) : null}

                            {q.options ? (
                              <div className="ml-2 space-y-2 border-l-2 border-brand/20 pl-3">
                                {q.options.map((opt, oIndex) => (
                                  <div key={opt.id ?? oIndex} className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      <Input
                                        placeholder="Opção"
                                        className="h-8 min-w-[140px] flex-1 rounded-lg text-xs"
                                        value={opt.label}
                                        onChange={(e: FormChangeEvent) =>
                                          updateOption(qIndex, oIndex, { label: e.target.value })
                                        }
                                      />
                                      {q.type !== 'yes_no' ? (
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8 shrink-0 rounded-full"
                                          aria-label="Remover opção"
                                          onClick={() => removeOption(qIndex, oIndex)}
                                        >
                                          <Trash2 className="h-3 w-3 opacity-50" />
                                        </Button>
                                      ) : null}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 pl-1">
                                      {documentRequirements.map((req) => (
                                        <label
                                          key={req.tag}
                                          className="flex items-center gap-1 text-[11px] text-muted-foreground"
                                        >
                                          <Checkbox
                                            checked={opt.documentTags.includes(req.tag)}
                                            onCheckedChange={() => toggleOptionDocumentTag(qIndex, oIndex, req.tag)}
                                          />
                                          {req.title || req.tag}
                                        </label>
                                      ))}
                                      <Input
                                        placeholder="+ Pedir documento se escolher esta opção…"
                                        className="h-7 w-64 rounded-lg border-dashed text-[11px]"
                                        value={newDocDraft[docDraftKey(qIndex, oIndex)] ?? ''}
                                        onChange={(e: FormChangeEvent) =>
                                          setNewDocDraft((prev) => ({
                                            ...prev,
                                            [docDraftKey(qIndex, oIndex)]: e.target.value,
                                          }))
                                        }
                                        onKeyDown={(e: { key: string; currentTarget: { value: string } }) => {
                                          if (e.key !== 'Enter') return
                                          addRequirementFromOption(qIndex, oIndex, e.currentTarget.value)
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                                {q.type !== 'yes_no' ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 rounded-full text-xs"
                                    onClick={() => addOption(qIndex)}
                                  >
                                    <Plus className="mr-1 h-3 w-3" /> Adicionar opção
                                  </Button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ))}
                        <div className="flex justify-end">
                          <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={addQuestion}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar pergunta
                          </Button>
                        </div>
                      </div>
                    )
                  ) : null}
                </SectionCard>

                <SectionCard title="Página do serviço" description="Aspecto da página pública deste serviço.">
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox
                      className="mt-0.5"
                      checked={showFirmLogo}
                      onCheckedChange={(checked: boolean | 'indeterminate') => setShowFirmLogo(Boolean(checked))}
                    />
                    <span>
                      Mostrar logótipo do escritório na página deste serviço
                      <span className="block text-xs text-muted-foreground">
                        Usa o logótipo definido no perfil do escritório.
                      </span>
                    </span>
                  </label>
                </SectionCard>
              </div>
            ) : null}

            {/* ----------------------------- Publicação ---------------------------- */}
            {tab === 'publicacao' ? (
              <SectionCard
                title="Publicação"
                description="Só aparece na página pública quando marcar a opção abaixo e tiver um endereço (slug) válido."
              >
                <div
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-sm',
                    publishState.id === 'published'
                      ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                      : 'border-amber-200 bg-amber-50/70 text-amber-950',
                  )}
                >
                  <p className="font-semibold">{publishState.label}</p>
                  <p className="mt-0.5 text-xs opacity-90">{publishState.description}</p>
                </div>
                <label className="block space-y-1 text-sm">
                  <span className="font-medium">Endereço público (slug)</span>
                  <Input
                    value={slug}
                    onChange={(e: FormChangeEvent) => setSlug(e.target.value)}
                    placeholder="ex.: consultoria-fiscal"
                    className="rounded-xl border-brand/20 bg-card font-mono text-xs"
                  />
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    className="mt-0.5"
                    checked={isPubliclyListed}
                    onCheckedChange={(checked: boolean | 'indeterminate') => setIsPubliclyListed(Boolean(checked))}
                  />
                  <span>
                    Publicar na página pública do escritório
                    <span className="block text-xs text-muted-foreground">
                      Precisa de um slug e de um formulário válido — perguntas de escolha sem opções bloqueiam a
                      publicação.
                    </span>
                  </span>
                </label>

                {isPubliclyListed && publicUrl ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-emerald-800">Assim o cliente chega a este serviço</p>
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-xs text-emerald-700 underline-offset-2 hover:underline"
                        >
                          {publicUrl}
                        </a>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full border-emerald-300 bg-white text-xs"
                        onClick={() => {
                          void navigator.clipboard.writeText(publicUrl)
                          toast.success('Link copiado')
                        }}
                      >
                        <Copy className="mr-1 h-3 w-3" /> Copiar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 rounded-full bg-brand text-xs"
                        onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
                      >
                        Abrir <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : isPubliclyListed ? (
                  <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <p>
                      Defina o endereço público (slug) acima e guarde para gerar o link que pode partilhar com os
                      clientes.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Enquanto não publicar, o serviço fica só interno (equipa). Os pedidos da página pública só chegam
                    depois de publicar.
                  </p>
                )}
                <Button type="button" size="sm" variant="outline" onClick={() => setTab('preview')}>
                  Ver pré-visualização
                </Button>
              </SectionCard>
            ) : null}

            {/* -------------------------- Pré-visualização ------------------------- */}
            {tab === 'preview' ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Assim o cliente verá este serviço (pré-visualização local — guarde e publique para o link real).
                </p>
                {showFirmLogo ? (
                  <div className="flex gap-2 rounded-xl border border-sky-200/80 bg-sky-50 px-3 py-2.5 text-xs text-sky-950">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                    <p>O logótipo do escritório aparece no topo desta página para o cliente.</p>
                  </div>
                ) : null}
                <div className="rounded-2xl border border-brand/15 bg-card p-4 shadow-sm">
                  <ServiceFormPreview
                    serviceName={name}
                    description={description}
                    onDescriptionChange={setDescription}
                    requiresBooking={requiresBooking}
                    intakeForm={draftIntakeForm}
                    imageUrl={imageUrl}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-brand/15 bg-card px-5 py-3">
            {!isCreate ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className="mr-auto rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deleting || saving}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> Apagar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={duplicating || saving}
                  onClick={() => void duplicateService()}
                >
                  {duplicating ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="mr-1.5 h-4 w-4" />
                  )}
                  Duplicar
                </Button>
              </>
            ) : null}
            <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="rounded-full bg-brand"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Guardar serviço
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={(next: boolean) => !next && setDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar “{service?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acção não pode ser desfeita. Se o serviço já tiver solicitações associadas, não será possível
              apagar — desactive-o em vez disso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e: { preventDefault: () => void }) => {
                e.preventDefault()
                void deleteService()
              }}
            >
              {deleting ? 'A apagar…' : 'Apagar definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImageCropDialog
        open={cropOpen}
        onOpenChange={(next) => {
          setCropOpen(next)
          if (!next) setCropFile(null)
        }}
        file={cropFile}
        title="Recortar banner do serviço"
        aspect={16 / 9}
        onCropped={uploadCroppedBanner}
      />
    </>
  )
}
