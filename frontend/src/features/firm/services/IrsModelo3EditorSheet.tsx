import { useEffect, useState } from 'react'
import {
  Briefcase,
  Globe2,
  Home,
  Info,
  Landmark,
  Loader2,
  PiggyBank,
  Save,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog'
import { DurationMinutesField, EuroInput } from '@/shared/design-system'
import { ServicePaymentMethodsPanel, type ServicePaymentMethodId } from '@/features/firm/services/ServicePaymentMethodsPanel'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import type {
  AccountingService,
  IntakeForm,
  IntakeQuestion,
  IrsAnexoId,
} from '@/shared/types/contabil'
import type { FormChangeEvent } from '@/shared/types/react-events'

type PaymentMethod = ServicePaymentMethodId

const DOC_SUGGESTIONS = [
  'recibos_vencimento',
  'recibos_verdes',
  'caderneta_predial',
  'contrato_arrendamento',
  'escritura_venda',
  'donativos',
  'cartao_cidadao',
  'efatura',
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

/** Espelha as perguntas yes_no do catálogo IRS Modelo 3 (docs condicionais). */
const DEFAULT_QUESTIONS: IntakeQuestion[] = [
  {
    id: 'q_dependentes',
    label: 'Tem dependentes a cargo (filhos ou outros)?',
    type: 'yes_no',
    required: true,
    options: [
      { id: 'sim', label: 'Sim', documentTags: ['cc_dependentes'] },
      { id: 'nao', label: 'Não', documentTags: [] },
    ],
  },
  {
    id: 'q_dep',
    label: 'Teve rendimentos de trabalho dependente (salário, pensão)?',
    type: 'yes_no',
    required: true,
    options: [
      { id: 'sim', label: 'Sim', documentTags: ['recibos_vencimento', 'declaracao_entidade'] },
      { id: 'nao', label: 'Não', documentTags: [] },
    ],
  },
  {
    id: 'q_ind',
    label: 'Teve rendimentos como trabalhador independente (recibos verdes / categoria B)?',
    type: 'yes_no',
    required: true,
    options: [
      { id: 'sim', label: 'Sim', documentTags: ['recibos_verdes', 'ss_independente', 'atividade_at'] },
      { id: 'nao', label: 'Não', documentTags: [] },
    ],
  },
  {
    id: 'q_capitais',
    label: 'Teve rendimentos de capitais (juros, dividendos, etc.)?',
    type: 'yes_no',
    required: true,
    options: [
      { id: 'sim', label: 'Sim', documentTags: ['extratos_capitais'] },
      { id: 'nao', label: 'Não', documentTags: [] },
    ],
  },
  {
    id: 'q_pred',
    label: 'Teve rendimentos prediais (arrendamento)?',
    type: 'yes_no',
    required: true,
    options: [
      { id: 'sim', label: 'Sim', documentTags: ['caderneta_predial', 'contrato_arrendamento', 'despesas_prediais'] },
      { id: 'nao', label: 'Não', documentTags: [] },
    ],
  },
  {
    id: 'q_mv',
    label: 'Teve mais-valias com venda de imóveis ou valores mobiliários?',
    type: 'yes_no',
    required: true,
    options: [
      { id: 'sim', label: 'Sim', documentTags: ['escritura_compra', 'escritura_venda', 'despesas_mais_valias'] },
      { id: 'nao', label: 'Não', documentTags: [] },
    ],
  },
  {
    id: 'q_exterior',
    label: 'Teve rendimentos obtidos no estrangeiro ou é não residente?',
    type: 'yes_no',
    required: true,
    options: [
      { id: 'sim', label: 'Sim', documentTags: ['docs_exterior'] },
      { id: 'nao', label: 'Não', documentTags: [] },
    ],
  },
  {
    id: 'q_ben',
    label: 'Pretende usufruir de benefícios fiscais (donativos, PPR, etc.)?',
    type: 'yes_no',
    required: true,
    options: [
      { id: 'sim', label: 'Sim', documentTags: ['donativos', 'ppr_pensoes'] },
      { id: 'nao', label: 'Não', documentTags: [] },
    ],
  },
  {
    id: 'q_habitacao',
    label: 'Tem crédito à habitação própria permanente?',
    type: 'yes_no',
    required: true,
    options: [
      { id: 'sim', label: 'Sim', documentTags: ['creditos_habitacao'] },
      { id: 'nao', label: 'Não', documentTags: [] },
    ],
  },
  {
    id: 'q_jovem',
    label: 'É elegível / quer aplicar o regime IRS Jovem?',
    type: 'yes_no',
    required: false,
    options: [
      { id: 'sim', label: 'Sim', documentTags: ['irs_jovem'] },
      { id: 'nao', label: 'Não', documentTags: [] },
    ],
  },
]

type EditorQuestion = {
  id: string
  label: string
  /** Pré-visualização no editor: resposta Sim activa o pedido de documento. */
  answerYes: boolean
  documentLabel: string
}

function toEditorQuestions(form: IntakeForm | null | undefined): EditorQuestion[] {
  const qs = form?.questions?.length ? form.questions : DEFAULT_QUESTIONS
  return qs
    .filter((q) => q.type === 'yes_no' || !q.type)
    .map((q, i) => {
      const sim = q.options?.find((o) => /^sim$/i.test(o.label) || o.id === 'sim')
      const tag = sim?.documentTags?.[0] || DOC_SUGGESTIONS[0]
      return {
        id: q.id || `q_${i}`,
        label: q.label,
        answerYes: true,
        documentLabel: tag,
      }
    })
}

function buildIntakeForm(
  questions: EditorQuestion[],
  anexos: IrsAnexoId[],
  taxYear: number | null,
): IntakeForm {
  return {
    irsConfig: { taxYear, anexos },
    questions: questions.map((q) => ({
      id: q.id,
      label: q.label,
      type: 'yes_no' as const,
      required: false,
      options: [
        {
          id: 'sim',
          label: 'Sim',
          documentTags: q.documentLabel.trim() ? [q.documentLabel.trim()] : [],
        },
        { id: 'nao', label: 'Não', documentTags: [] },
      ],
    })),
  }
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-brand' : 'bg-muted-foreground/25',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}

type Props = {
  service: AccountingService | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function IrsModelo3EditorSheet({ service, open, onOpenChange, onSaved }: Props) {
  const isCreate = !service

  const [name, setName] = useState('Declaração IRS Modelo 3')
  const [taxYear, setTaxYear] = useState<string>('')
  const [durationMinutes, setDurationMinutes] = useState(120)
  const [priceEuros, setPriceEuros] = useState(120)
  const [anexos, setAnexos] = useState<IrsAnexoId[]>(['A', 'B', 'F', 'H'])
  const [questions, setQuestions] = useState<EditorQuestion[]>(() => toEditorQuestions(null))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const [paymentRequired, setPaymentRequired] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (service) {
      const year = service.intakeForm?.irsConfig?.taxYear
      setName(service.name)
      setTaxYear(year != null ? String(year) : '')
      setDurationMinutes(service.durationMinutes || 120)
      setPriceEuros((service.priceCents || 0) / 100)
      setAnexos(
        (service.intakeForm?.irsConfig?.anexos as IrsAnexoId[] | undefined)?.length
          ? (service.intakeForm!.irsConfig!.anexos as IrsAnexoId[])
          : ['A', 'B', 'F', 'H'],
      )
      setQuestions(toEditorQuestions(service.intakeForm))
      setPaymentMethod(service.paymentMethod || 'bank_transfer')
      setPaymentRequired(Boolean(service.paymentRequired))
    } else {
      setName('Declaração IRS Modelo 3')
      setTaxYear('')
      setDurationMinutes(120)
      setPriceEuros(120)
      setAnexos(['A', 'B', 'F', 'H'])
      setQuestions(toEditorQuestions(null))
      setPaymentMethod('bank_transfer')
      setPaymentRequired(false)
    }
  }, [open, service])

  const toggleAnexo = (id: IrsAnexoId) => {
    setAnexos((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
  }

  const updateQuestion = (id: string, patch: Partial<EditorQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  }

  const displayTitle = (() => {
    const y = taxYear.trim()
    if (y && /^\d{4}$/.test(y)) return `${name.trim() || 'Declaração IRS Modelo 3'} · ${y}`
    return name.trim() || 'Declaração IRS Modelo 3'
  })()

  const save = async () => {
    if (!name.trim()) {
      toast.error('Indique o nome do serviço')
      return
    }
    const yearNum = taxYear.trim() ? Number(taxYear.trim()) : null
    if (taxYear.trim() && (!Number.isFinite(yearNum) || yearNum! < 2000 || yearNum! > 2100)) {
      toast.error('Ano fiscal inválido', { description: 'Use um ano com 4 dígitos (ex.: 2026).' })
      return
    }

    const intakeForm = {
      ...buildIntakeForm(questions, anexos, yearNum),
      pageOptions: service?.intakeForm?.pageOptions || { showFirmLogo: true },
    }
    const payload = {
      name: name.trim(),
      durationMinutes,
      priceEuros,
      isActive: true,
      catalogKey: service?.catalogKey || 'irs-modelo-3',
      paymentMethod: paymentRequired ? 'stripe_connect' : paymentMethod,
      paymentRequired,
      intakeForm,
      requiresBooking: false,
    }

    setSaving(true)
    try {
      if (isCreate) {
        await contabilAccountingServicesApi.create(payload)
        toast.success('Serviço IRS criado')
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(92dvh,calc(100dvh-1.5rem))] w-[calc(100vw-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border border-brand/20 p-0 shadow-xl sm:max-w-5xl"
      >
        <DialogTitle className="sr-only">{displayTitle}</DialogTitle>

        <div className="shrink-0 border-b border-brand/15 bg-gradient-to-r from-brand/[0.08] via-sky-500/[0.06] to-transparent px-5 py-4 pr-12">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand/80">Serviços › IRS</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{displayTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Anexos, perguntas e pagamento — o ano fiscal é definido pelo escritório. Para banner, logótipo,
            publicação completa e apagar, use <span className="font-medium text-foreground">Editar</span> na
            lista IRS.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-4 py-4 sm:px-5">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Nome do serviço</span>
              <Input
                value={name}
                onChange={(e: FormChangeEvent) => setName(e.target.value)}
                className="rounded-xl border-brand/20 bg-card"
                placeholder="Declaração IRS Modelo 3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Ano fiscal</span>
              <Input
                type="number"
                inputMode="numeric"
                min={2000}
                max={2100}
                value={taxYear}
                onChange={(e: FormChangeEvent) => setTaxYear(e.target.value)}
                className="rounded-xl border-brand/20 bg-card"
                placeholder="ex.: 2026"
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
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-2">
            {/* Anexos — sticky só em desktop (≥1280); tablet/mobile iguais */}
            <section className="flex flex-col overflow-hidden rounded-2xl border border-brand/15 bg-card shadow-sm xl:sticky xl:top-0 xl:z-[1] xl:self-start xl:overflow-visible">
              <div className="border-b border-brand/10 bg-brand/[0.04] px-4 py-3">
                <h3 className="text-base font-semibold text-foreground">Anexos</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Selecione os anexos aplicáveis a este serviço.
                </p>
              </div>
              <ul className="divide-y divide-border/40">
                {ANEXOS.map(({ id, title, subtitle, Icon }) => {
                  const on = anexos.includes(id)
                  return (
                    <li key={id} className="flex items-center gap-3 px-4 py-3">
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                          on ? 'bg-brand text-primary-foreground' : 'bg-muted text-muted-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                      </div>
                      <Toggle checked={on} onChange={() => toggleAnexo(id)} label={title} />
                    </li>
                  )
                })}
              </ul>
              <div className="m-3 flex gap-2 rounded-xl border border-sky-200/80 bg-sky-50 px-3 py-2.5 text-xs text-sky-950">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <p>
                  Os anexos podem ser ajustados mais tarde. Poderá adicionar ou remover anexos a qualquer
                  momento.
                </p>
              </div>
            </section>

            {/* Perguntas + Pagamento */}
            <div className="flex min-w-0 flex-col gap-4">
              <section className="overflow-hidden rounded-2xl border border-brand/15 bg-card shadow-sm">
                <div className="border-b border-brand/10 bg-sky-500/[0.06] px-4 py-3">
                  <h3 className="text-base font-semibold">Perguntas</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Responda às perguntas seguintes. Se responder Sim, será pedido o documento indicado.
                  </p>
                </div>
                <ul className="divide-y divide-border/40">
                  {questions.map((q) => (
                    <li key={q.id} className="space-y-3 px-4 py-4">
                      <p className="text-sm font-medium leading-snug">{q.label}</p>
                      <div className="flex flex-wrap gap-4">
                        {(['Sim', 'Não'] as const).map((label) => {
                          const yes = label === 'Sim'
                          const selected = q.answerYes === yes
                          return (
                            <label key={label} className="flex cursor-pointer items-center gap-2 text-sm">
                              <input
                                type="radio"
                                name={`ans-${q.id}`}
                                checked={selected}
                                onChange={() => updateQuestion(q.id, { answerYes: yes })}
                                className="accent-[var(--cb-brand,#0F2942)]"
                              />
                              {label}
                            </label>
                          )
                        })}
                      </div>
                      {q.answerYes ? (
                        <div className="space-y-1.5">
                          <label className="block space-y-1 text-sm">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Documento
                            </span>
                            <Input
                              list={`irs-doc-suggestions-${q.id}`}
                              value={q.documentLabel}
                              onChange={(e: FormChangeEvent) =>
                                updateQuestion(q.id, { documentLabel: e.target.value })
                              }
                              placeholder="Escreva o documento ou escolha uma sugestão"
                              className="rounded-xl border-brand/20 bg-background"
                            />
                            <datalist id={`irs-doc-suggestions-${q.id}`}>
                              {DOC_SUGGESTIONS.map((opt) => (
                                <option key={opt} value={opt} />
                              ))}
                            </datalist>
                          </label>
                          <p className="text-caption text-muted-foreground">
                            Sugestões ao digitar — pode escrever o nome à sua maneira. Formatos: PDF,
                            JPG, PNG · máx. 10 MB.
                          </p>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="overflow-hidden rounded-2xl border border-brand/15 bg-card shadow-sm">
                <div className="border-b border-brand/10 bg-brand/[0.04] px-4 py-3">
                  <h3 className="text-base font-semibold">Pagamento</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Mesmas opções dos outros serviços — configure o que o escritório usa hoje.
                  </p>
                </div>
                <div className="p-3">
                  <ServicePaymentMethodsPanel
                    paymentMethod={paymentMethod}
                    paymentRequired={paymentRequired}
                    requiresBooking={false}
                    onPaymentMethodChange={setPaymentMethod}
                    onPaymentRequiredChange={setPaymentRequired}
                  />
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-brand/15 bg-card px-5 py-3">
          <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" className="rounded-full bg-brand" disabled={saving} onClick={() => void save()}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Guardar serviço
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function isModelo3Service(s: { name: string; catalogKey?: string | null }) {
  if (s.catalogKey === 'irs-modelo-3') return true
  return /modelo\s*3/i.test(s.name)
}
