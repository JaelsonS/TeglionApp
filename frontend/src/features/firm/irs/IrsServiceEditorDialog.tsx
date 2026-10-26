import { useEffect, useMemo, useState } from 'react'
import {
  Briefcase,
  CheckCircle2,
  Globe2,
  Home,
  Landmark,
  Loader2,
  PiggyBank,
  Save,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

import { isModelo3Service } from '@/features/firm/services/IrsModelo3EditorSheet'
import {
  ServicePaymentMethodsPanel,
  type ServicePaymentMethodId,
} from '@/features/firm/services/ServicePaymentMethodsPanel'
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
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { DurationMinutesField, EuroInput } from '@/shared/design-system'
import { useAuth } from '@/shared/hooks/useAuth'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import type {
  AccountingService,
  IntakeForm,
  IntakeQuestion,
  IrsAnexoId,
  IrsAnexoLabel,
} from '@/shared/types/contabil'
import type { ButtonClickEvent, FormChangeEvent } from '@/shared/types/react-events'
import type { ChangeEvent } from 'react'

type PaymentMethod = ServicePaymentMethodId
type TabId = 'oferta' | 'anexos' | 'publicar'

const TABS: { id: TabId; label: string }[] = [
  { id: 'oferta', label: 'Oferta' },
  { id: 'anexos', label: 'Anexos' },
  { id: 'publicar', label: 'Publicar' },
]

const ANEXOS: {
  id: IrsAnexoId
  title: string
  subtitle: string
  Icon: typeof User
}[] = [
  { id: 'A', title: 'Anexo A', subtitle: 'Dependente', Icon: User },
  { id: 'B', title: 'Anexo B', subtitle: 'Independente / recibos verdes', Icon: Briefcase },
  { id: 'C', title: 'Anexo C', subtitle: 'Capital', Icon: PiggyBank },
  { id: 'F', title: 'Anexo F', subtitle: 'Prediais', Icon: Home },
  { id: 'G', title: 'Anexo G', subtitle: 'Mais-valias imóveis', Icon: TrendingUp },
  { id: 'H', title: 'Anexo H', subtitle: 'Benefícios fiscais', Icon: Landmark },
  { id: 'J', title: 'Anexo J', subtitle: 'Não residentes', Icon: Globe2 },
  { id: 'JOVEM', title: 'IRS Jovem', subtitle: 'Regime IRS Jovem', Icon: Sparkles },
]

function slugifyServiceName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/**
 * Guarda irsConfig sem destruir perguntas não-yes_no do catálogo (bug do editor antigo).
 */
function mergeIntakeForm(
  existing: IntakeForm | null | undefined,
  anexos: IrsAnexoId[],
  taxYear: number | null,
  anexoLabels: Partial<Record<IrsAnexoId, IrsAnexoLabel>>,
): IntakeForm {
  const cleanedLabels: Partial<Record<IrsAnexoId, IrsAnexoLabel>> = {}
  for (const id of anexos) {
    const entry = anexoLabels[id]
    if (!entry) continue
    const title = String(entry.title || '').trim()
    const subtitle = String(entry.subtitle || '').trim()
    if (title || subtitle) {
      cleanedLabels[id] = {
        ...(title ? { title } : {}),
        ...(subtitle ? { subtitle } : {}),
      }
    }
  }

  const questions: IntakeQuestion[] = existing?.questions?.length ? [...existing.questions] : []

  return {
    questions,
    pageOptions: existing?.pageOptions || { showFirmLogo: true },
    irsConfig: {
      taxYear,
      anexos,
      ...(Object.keys(cleanedLabels).length ? { anexoLabels: cleanedLabels } : {}),
    },
  }
}

type Props = {
  service: AccountingService | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  /** Abrir editor geral (banner / formulário avançado) — opcional. */
  onOpenAdvanced?: (service: AccountingService) => void
  /** Prefer Modelo 3 defaults on create. */
  preferModelo3?: boolean
  /** Abrir directamente num tab (ex.: publicar). */
  initialTab?: TabId
}

export function IrsServiceEditorDialog({
  service,
  open,
  onOpenChange,
  onSaved,
  onOpenAdvanced,
  preferModelo3 = false,
  initialTab = 'oferta',
}: Props) {
  const { user } = useAuth()
  const firmSlug = user?.tenant?.slug
  const isCreate = !service
  const modelo3 = service ? isModelo3Service(service) : preferModelo3

  const [tab, setTab] = useState<TabId>('oferta')
  const [name, setName] = useState('Declaração IRS')
  const [taxYear, setTaxYear] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(120)
  const [priceEuros, setPriceEuros] = useState(120)
  const [anexos, setAnexos] = useState<IrsAnexoId[]>(['A', 'B', 'F', 'H'])
  const [anexoLabels, setAnexoLabels] = useState<Partial<Record<IrsAnexoId, IrsAnexoLabel>>>({})
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const [paymentRequired, setPaymentRequired] = useState(false)
  const [slug, setSlug] = useState('')
  const [isPubliclyListed, setIsPubliclyListed] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setTab(initialTab)
    setSlugTouched(false)
    if (service) {
      const year = service.intakeForm?.irsConfig?.taxYear
      setName(service.name)
      setTaxYear(year != null ? String(year) : '')
      setDescription(service.description || '')
      setDurationMinutes(service.durationMinutes || 120)
      setPriceEuros((service.priceCents || 0) / 100)
      setAnexos(
        (service.intakeForm?.irsConfig?.anexos as IrsAnexoId[] | undefined)?.length
          ? (service.intakeForm!.irsConfig!.anexos as IrsAnexoId[])
          : ['A', 'B', 'F', 'H'],
      )
      setAnexoLabels(service.intakeForm?.irsConfig?.anexoLabels || {})
      setPaymentMethod(service.paymentMethod || 'bank_transfer')
      setPaymentRequired(Boolean(service.paymentRequired))
      setSlug(service.slug || '')
      setIsPubliclyListed(Boolean(service.isPubliclyListed))
      setIsActive(service.isActive !== false)
    } else {
      setName(preferModelo3 ? 'Declaração IRS Modelo 3' : 'Serviço IRS')
      setTaxYear(String(new Date().getFullYear()))
      setDescription('')
      setDurationMinutes(120)
      setPriceEuros(120)
      setAnexos(['A', 'B', 'F', 'H'])
      setAnexoLabels({})
      setPaymentMethod('bank_transfer')
      setPaymentRequired(false)
      setSlug('')
      setIsPubliclyListed(false)
      setIsActive(true)
    }
  }, [open, service, preferModelo3, initialTab])

  const displayTitle = useMemo(() => {
    const y = taxYear.trim()
    const base = name.trim() || (modelo3 ? 'Declaração IRS Modelo 3' : 'Serviço IRS')
    if (y && /^\d{4}$/.test(y)) return `${base} · ${y}`
    return base
  }, [name, taxYear, modelo3])

  const publicUrl =
    firmSlug && slug.trim()
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${encodeURIComponent(firmSlug)}/servicos/${encodeURIComponent(slug.trim())}`
      : null

  function toggleAnexo(id: IrsAnexoId) {
    setAnexos((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
  }

  function patchAnexoLabel(id: IrsAnexoId, patch: IrsAnexoLabel) {
    setAnexoLabels((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }))
  }

  function suggestSlug() {
    const base = slugifyServiceName(name.trim() || 'irs')
    const y = taxYear.trim()
    setSlug(y && /^\d{4}$/.test(y) ? `${base}-${y}` : base)
    setSlugTouched(true)
  }

  async function save() {
    if (!name.trim()) {
      toast.error('Indique o nome do serviço')
      setTab('oferta')
      return
    }
    const yearNum = taxYear.trim() ? Number(taxYear.trim()) : null
    if (taxYear.trim() && (!Number.isFinite(yearNum) || yearNum! < 2000 || yearNum! > 2100)) {
      toast.error('Ano fiscal inválido', { description: 'Use um ano com 4 dígitos (ex.: 2026).' })
      setTab('oferta')
      return
    }
    if (isPubliclyListed && !slug.trim()) {
      toast.error('Defina o endereço público (slug) para publicar')
      setTab('publicar')
      return
    }

    const intakeForm = mergeIntakeForm(
      service?.intakeForm,
      anexos,
      yearNum,
      anexoLabels,
    )

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      durationMinutes,
      priceEuros,
      isActive,
      catalogKey: service?.catalogKey || (modelo3 || preferModelo3 ? 'irs-modelo-3' : null),
      paymentMethod: paymentRequired ? 'stripe_connect' : paymentMethod,
      paymentRequired,
      intakeForm,
      requiresBooking: false,
      slug: slug.trim() || null,
      isPubliclyListed,
    }

    setSaving(true)
    try {
      if (isCreate) {
        await contabilAccountingServicesApi.create(payload)
        toast.success(isPubliclyListed ? 'Serviço IRS criado e publicado' : 'Serviço IRS criado')
      } else {
        await contabilAccountingServicesApi.patch(service!.id, payload)
        toast.success(isPubliclyListed ? 'Guardado e publicado' : 'Serviço guardado')
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!service) return
    setDeleting(true)
    try {
      await contabilAccountingServicesApi.remove(service.id)
      toast.success('Serviço apagado')
      setDeleteOpen(false)
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error('Não foi possível apagar', { description: getErrorMessage(err) })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[min(92dvh,calc(100dvh-1.5rem))] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
          <DialogTitle className="sr-only">{displayTitle}</DialogTitle>

          <div className="shrink-0 border-b border-border/60 px-5 py-4 pr-12">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand">Área IRS</p>
                <h2 className="mt-0.5 text-lg font-semibold tracking-tight">{displayTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Oferta, anexos e publicação num só sítio. O Teglion não calcula imposto nem submete à AT.
                </p>
              </div>
              <AskMayaButton intentId={modelo3 ? 'irs-modelo3' : 'irs-campaign'} />
            </div>

            <nav className="mt-3 flex gap-1 border-b border-border/50 -mb-px" aria-label="Secções do editor IRS">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={cn(
                    'relative px-3 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground',
                    tab === t.id && 'font-semibold text-foreground',
                  )}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {tab === t.id ? (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-brand" />
                  ) : null}
                </button>
              ))}
            </nav>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {tab === 'oferta' ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block space-y-1.5 text-sm sm:col-span-2">
                    <span className="font-medium">Nome</span>
                    <Input
                      value={name}
                      onChange={(e: FormChangeEvent) => {
                        setName(e.target.value)
                        if (!slugTouched && isCreate) {
                          setSlug(slugifyServiceName(e.target.value))
                        }
                      }}
                      placeholder="Declaração IRS Modelo 3"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium">Ano fiscal</span>
                    <Input
                      value={taxYear}
                      onChange={(e: FormChangeEvent) => setTaxYear(e.target.value)}
                      placeholder="2026"
                      inputMode="numeric"
                    />
                  </label>
                </div>

                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium">Descrição (opcional)</span>
                  <textarea
                    className="min-h-[4.5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={description}
                    onChange={(e: FormChangeEvent) => setDescription(e.target.value)}
                    placeholder="O que inclui este serviço para o cliente…"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 text-sm">
                    <span className="font-medium">Duração</span>
                    <DurationMinutesField value={durationMinutes} onChange={setDurationMinutes} />
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <span className="font-medium">Preço</span>
                    <EuroInput value={priceEuros} onChange={setPriceEuros} />
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 p-3">
                  <p className="mb-2 text-sm font-medium">Pagamento</p>
                  <ServicePaymentMethodsPanel
                    paymentMethod={paymentMethod}
                    paymentRequired={paymentRequired}
                    requiresBooking={false}
                    onPaymentMethodChange={setPaymentMethod}
                    onPaymentRequiredChange={setPaymentRequired}
                  />
                </div>
              </>
            ) : null}

            {tab === 'anexos' ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Escolha os anexos que o cliente pode indicar. Personalize o título se o gabinete usar outra
                  linguagem.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ANEXOS.map(({ id, title, subtitle, Icon }) => {
                    const on = anexos.includes(id)
                    const custom = anexoLabels[id]
                    return (
                      <div
                        key={id}
                        className={cn(
                          'rounded-xl border px-3 py-2.5 transition',
                          on ? 'border-brand/40 bg-brand/[0.04]' : 'border-border/60 bg-card',
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={on}
                            aria-label={title}
                            className={cn(
                              'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors',
                              on ? 'bg-brand' : 'bg-muted-foreground/25',
                            )}
                            onClick={() => toggleAnexo(id)}
                          >
                            <span
                              className={cn(
                                'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                                on && 'translate-x-5',
                              )}
                            />
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5 text-brand" aria-hidden />
                              <p className="text-sm font-semibold">{custom?.title || title}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{custom?.subtitle || subtitle}</p>
                            {on ? (
                              <div className="mt-2 space-y-1.5">
                                <Input
                                  className="h-8 text-xs"
                                  placeholder={`Título (ex.: ${title})`}
                                  value={custom?.title || ''}
                                  onChange={(e: FormChangeEvent) =>
                                    patchAnexoLabel(id, { title: e.target.value })
                                  }
                                />
                                <Input
                                  className="h-8 text-xs"
                                  placeholder="Subtítulo opcional"
                                  value={custom?.subtitle || ''}
                                  onChange={(e: FormChangeEvent) =>
                                    patchAnexoLabel(id, { subtitle: e.target.value })
                                  }
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {!modelo3 && !preferModelo3 ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                    Anexos aplicam-se sobretudo ao Modelo 3. Pode mesmo assim guardar metadados para este serviço.
                  </p>
                ) : null}
              </>
            ) : null}

            {tab === 'publicar' ? (
              <>
                <div
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-sm',
                    isPubliclyListed ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/50',
                  )}
                >
                  {isPubliclyListed ? (
                    <p className="flex items-center gap-2 font-medium text-emerald-950">
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                      Visível na página pública (após guardar)
                    </p>
                  ) : (
                    <p className="font-medium text-amber-950">Ainda só interno — não aparece no site.</p>
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={isActive}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
                  />
                  <span className="font-medium">Activo no gabinete</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={isPubliclyListed}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setIsPubliclyListed(e.target.checked)
                      if (e.target.checked && !slug.trim()) suggestSlug()
                    }}
                  />
                  <span className="font-medium">Publicar na página pública</span>
                </label>

                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium">Endereço público (slug)</span>
                  <div className="flex gap-2">
                    <Input
                      value={slug}
                      onChange={(e: FormChangeEvent) => {
                        setSlug(e.target.value)
                        setSlugTouched(true)
                      }}
                      placeholder="declaracao-irs-2026"
                    />
                    <Button type="button" variant="outline" onClick={suggestSlug}>
                      Gerar
                    </Button>
                  </div>
                  {publicUrl ? (
                    <p className="break-all text-xs text-muted-foreground">{publicUrl}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Ex.: /{firmSlug || 'gabinete'}/servicos/declaracao-irs-2026
                    </p>
                  )}
                </label>

                {!isCreate && onOpenAdvanced ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      onOpenChange(false)
                      onOpenAdvanced(service!)
                    }}
                  >
                    Editor avançado (banner, formulário, apagar opções…)
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col gap-2 border-t border-border/60 bg-muted/15 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {!isCreate ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                  onClick={() => setDeleteOpen(true)}
                  disabled={saving || deleting}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" aria-hidden />
                  Apagar
                </Button>
              ) : (
                <span />
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void save()} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />A guardar…
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-4 w-4" aria-hidden />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar este serviço IRS?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove o serviço do gabinete. Pedidos já recebidos mantêm-se em Solicitações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e: ButtonClickEvent) => {
                e.preventDefault()
                void remove()
              }}
            >
              {deleting ? 'A apagar…' : 'Sim, apagar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
