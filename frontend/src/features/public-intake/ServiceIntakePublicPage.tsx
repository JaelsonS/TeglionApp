import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { contabilPublicApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import type { IntakeQuestion } from '@/shared/types/contabil'
import type { PublicIntakeSubmitResult } from '@/infrastructure/api/contabil/public'
import type { FormChangeEvent, FormSubmitEvent } from '@/shared/types/react-events'
import { SanitizedServiceHtml } from '@/shared/design-system/SanitizedServiceHtml'

function formatScheduledAt(iso: string) {
  return new Date(iso).toLocaleString('pt-PT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Lisbon',
  })
}

type Answers = Record<string, string | string[]>

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: IntakeQuestion
  value: string | string[] | undefined
  onChange: (value: string | string[]) => void
}) {
  if (question.type === 'single_choice' || question.type === 'yes_no') {
    return (
      <div className="space-y-1.5">
        {(question.options ?? []).map((opt) => (
          <label key={opt.id ?? opt.label} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={question.id ?? question.label}
              className="h-4 w-4"
              checked={value === (opt.id ?? opt.label)}
              onChange={() => onChange(opt.id ?? opt.label)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    )
  }

  if (question.type === 'multiple_choice') {
    const selected = Array.isArray(value) ? value : []
    return (
      <div className="space-y-1.5">
        {(question.options ?? []).map((opt) => {
          const optValue = opt.id ?? opt.label
          return (
            <label key={optValue} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.includes(optValue)}
                onCheckedChange={(checked: boolean | 'indeterminate') => {
                  const isChecked = Boolean(checked)
                  onChange(
                    isChecked ? [...selected, optValue] : selected.filter((v) => v !== optValue),
                  )
                }}
              />
              {opt.label}
            </label>
          )
        })}
      </div>
    )
  }

  const inputType = question.type === 'date' ? 'date' : question.type === 'email' ? 'email' : 'text'
  return (
    <Input
      type={inputType}
      className="h-10 rounded-lg"
      value={typeof value === 'string' ? value : ''}
      onChange={(e: FormChangeEvent) => onChange(e.target.value)}
    />
  )
}

export function ServiceIntakePublicPage() {
  const { firmSlug, serviceSlug } = useParams<{ firmSlug: string; serviceSlug: string }>()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [taxId, setTaxId] = useState('')
  const [website, setWebsite] = useState('')
  const [answers, setAnswers] = useState<Answers>({})
  const [scheduledAt, setScheduledAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<PublicIntakeSubmitResult | null>(null)
  const [step, setStep] = useState<1 | 2>(1)
  const [leadAccessToken, setLeadAccessToken] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [legalDialog, setLegalDialog] = useState<'terms' | 'privacy' | null>(null)

  const query = useQuery({
    queryKey: ['public-service-intake', firmSlug, serviceSlug],
    queryFn: () => contabilPublicApi.getPublicService(firmSlug!, serviceSlug!),
    enabled: Boolean(firmSlug && serviceSlug),
    retry: false,
  })

  const slotsQuery = useQuery({
    queryKey: ['public-service-slots', firmSlug, serviceSlug],
    queryFn: () => contabilPublicApi.getPublicSlots(firmSlug!, serviceSlug!),
    enabled: Boolean(firmSlug && serviceSlug && query.data?.requiresBooking && step === 2),
    retry: false,
  })

  const setAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const needsLegal = Boolean(query.data?.termsText || query.data?.privacyText)

  async function onStep1(e: FormSubmitEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Indique o seu nome')
      return
    }
    if (!email.trim()) {
      toast.error('Indique o seu email')
      return
    }
    if (needsLegal && !acceptedTerms) {
      toast.error('Aceite os termos e a política de privacidade para continuar')
      return
    }
    setSubmitting(true)
    try {
      const res = await contabilPublicApi.captureServiceLead(firmSlug!, serviceSlug!, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        taxId: taxId.trim() || undefined,
        website: website || undefined,
      })
      setLeadAccessToken(res.accessToken)
      setStep(2)
    } catch (err) {
      toast.error('Não foi possível guardar o contacto', { description: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  async function onSubmit(e: FormSubmitEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error('Nome e email são obrigatórios')
      return
    }
    if (query.data?.requiresBooking && !scheduledAt) {
      toast.error('Escolha um horário')
      return
    }
    setSubmitting(true)
    try {
      const res = await contabilPublicApi.submitServiceIntake(firmSlug!, serviceSlug!, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        taxId: taxId.trim() || undefined,
        answers,
        website: website || undefined,
        scheduledAt: scheduledAt || undefined,
        leadAccessToken: leadAccessToken || undefined,
      })
      setResult(res)
    } catch (err) {
      toast.error('Não foi possível enviar o pedido', { description: getErrorMessage(err) })
      if (query.data?.requiresBooking) {
        setScheduledAt('')
        void queryClient.invalidateQueries({ queryKey: ['public-service-slots', firmSlug, serviceSlug] })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (query.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-center text-sm text-muted-foreground">
          Este serviço não está disponível ou o link está incorrecto.
        </p>
      </div>
    )
  }

  const service = query.data

  if (result) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-border/50 bg-card p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <h1 className="text-lg font-semibold">Pedido recebido</h1>
          <p className="text-sm text-muted-foreground">
            Enviámos um email de confirmação
            {result.documentsRequired > 0 ? ' com a lista de documentos necessários.' : '.'}
          </p>
          {result.scheduledAt ? (
            <p
              className={
                result.bookingConfirmed
                  ? 'rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800'
                  : 'rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-800'
              }
            >
              {result.bookingConfirmed
                ? `O seu horário foi confirmado: ${formatScheduledAt(result.scheduledAt)}.`
                : `Preferência de horário registada: ${formatScheduledAt(result.scheduledAt)}. Este horário será analisado e confirmado pela contabilista.`}
            </p>
          ) : null}
          {result.documentsRequired > 0 ? (
            <Button asChild className="w-full rounded-full">
              <Link to={`/pedidos/${result.accessToken}`}>Enviar documentos agora</Link>
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 py-10">
      <header className="mb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{service.firmName}</p>
        {service.imageUrl ? (
          <img src={service.imageUrl} alt="" className="mb-3 max-h-48 w-full rounded-xl object-cover" />
        ) : null}
        <h1 className="text-2xl font-bold">{service.serviceName}</h1>
        {service.description ? <SanitizedServiceHtml html={service.description} className="text-sm" /> : null}
        {service.showPrices !== false && (service.priceCents ?? 0) > 0 ? (
          <p className="text-sm font-semibold text-primary">
            {((service.priceCents || 0) / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </p>
        ) : null}
      </header>

      <form
        onSubmit={step === 1 ? onStep1 : onSubmit}
        className="space-y-5 rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
      >
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />

        <p className="text-xs font-medium text-muted-foreground">Etapa {step} de 2</p>

        {step === 1 ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Nome *</span>
                <Input className="h-10 rounded-lg" value={name} onChange={(e: FormChangeEvent) => setName(e.target.value)} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">NIF</span>
                <Input className="h-10 rounded-lg" value={taxId} onChange={(e: FormChangeEvent) => setTaxId(e.target.value)} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Email *</span>
                <Input
                  type="email"
                  className="h-10 rounded-lg"
                  value={email}
                  onChange={(e: FormChangeEvent) => setEmail(e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Telefone</span>
                <Input className="h-10 rounded-lg" value={phone} onChange={(e: FormChangeEvent) => setPhone(e.target.value)} />
              </label>
            </div>

            {needsLegal ? (
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={acceptedTerms} onCheckedChange={(v: boolean | 'indeterminate') => setAcceptedTerms(v === true)} className="mt-0.5" />
                <span>
                  Li e aceito os{' '}
                  {service.termsText ? (
                    <button type="button" className="underline" onClick={() => setLegalDialog('terms')}>
                      Termos de Utilização
                    </button>
                  ) : null}
                  {service.termsText && service.privacyText ? ' e a ' : null}
                  {service.privacyText ? (
                    <button type="button" className="underline" onClick={() => setLegalDialog('privacy')}>
                      Política de Privacidade
                    </button>
                  ) : null}
                  .
                </span>
              </label>
            ) : null}

            <Button type="submit" className="w-full rounded-full" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continuar
            </Button>
          </>
        ) : (
          <>
            {service.requiresBooking ? (
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Horário *</span>
                {slotsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">A carregar horários disponíveis…</p>
                ) : (slotsQuery.data?.slots.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem horários disponíveis de momento.</p>
                ) : (
                  <select
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  >
                    <option value="">Escolha um horário…</option>
                    {slotsQuery.data?.slots.map((iso) => (
                      <option key={iso} value={iso}>
                        {new Date(iso).toLocaleString('pt-PT', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Europe/Lisbon',
                        })}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            ) : null}

            {service.intakeForm.questions.map((q, index) => (
              <div key={q.id ?? index} className="space-y-1.5 border-t border-border/40 pt-4">
                <span className="text-sm font-medium">
                  {q.label}
                  {q.required ? ' *' : ''}
                </span>
                <QuestionField
                  question={q}
                  value={answers[q.id ?? String(index)]}
                  onChange={(value) => setAnswer(q.id ?? String(index), value)}
                />
              </div>
            ))}

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button type="submit" className="flex-1 rounded-full" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enviar pedido
              </Button>
            </div>
          </>
        )}
      </form>

      <Dialog open={Boolean(legalDialog)} onOpenChange={(open: boolean) => !open && setLegalDialog(null)}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{legalDialog === 'privacy' ? 'Política de Privacidade' : 'Termos de Utilização'}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] whitespace-pre-wrap text-sm text-muted-foreground">
            {legalDialog === 'privacy' ? service.privacyText : service.termsText}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
