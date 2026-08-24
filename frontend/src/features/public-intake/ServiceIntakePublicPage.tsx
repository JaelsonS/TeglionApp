import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { PhoneNumberInputLazyWrapper as PhoneNumberInput } from '@/shared/components/ui/phone-input-lazy'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { TurnstileField, type TurnstileFieldHandle } from '@/shared/components/security/TurnstileField'
import { contabilPublicApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { openExternalUrl } from '@/shared/utils/openExternalUrl'
import { applyFirmBranding } from '@/shared/utils/firmBranding'
import { priceTaxModeCaption } from '@/shared/utils/priceTaxMode'
import { withTurnstileToken } from '@/shared/security/withTurnstileToken'
import { isTurnstileEnabled, TURNSTILE_ACTIONS } from '@/shared/security/turnstile'
import type { IntakeQuestion } from '@/shared/types/contabil'
import type { PublicIntakeSubmitResult } from '@/infrastructure/api/contabil/public'
import type { FormChangeEvent, FormSubmitEvent } from '@/shared/types/react-events'
import { SanitizedServiceHtml } from '@/shared/design-system/SanitizedServiceHtml'
import { TeglionPublicCredit } from '@/features/public-intake/TeglionPublicCredit'
import { PublicSlotCalendar } from '@/features/public-intake/PublicSlotCalendar'
import { servicePositionedImageStyle } from '@/shared/utils/servicePositionedImageStyle'

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
  const [holdToken, setHoldToken] = useState('')
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<PublicIntakeSubmitResult | null>(null)
  const [step, setStep] = useState(1)
  const [leadAccessToken, setLeadAccessToken] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [legalDialog, setLegalDialog] = useState<'terms' | 'privacy' | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [nowMs, setNowMs] = useState(() => Date.now())
  const turnstileRef = useRef<TurnstileFieldHandle | null>(null)
  const turnstileOk = !isTurnstileEnabled() || Boolean(turnstileToken)

  const query = useQuery({
    queryKey: ['public-service-intake', firmSlug, serviceSlug],
    queryFn: () => contabilPublicApi.getPublicService(firmSlug!, serviceSlug!),
    enabled: Boolean(firmSlug && serviceSlug),
    retry: false,
  })

  const calendarFirst = Boolean(query.data?.requiresBooking && query.data?.intakeStartMode === 'calendar')
  const totalSteps = calendarFirst ? 3 : 2
  const identityStep = calendarFirst ? 2 : 1
  const questionsStep = calendarFirst ? 3 : 2
  const calendarStep = calendarFirst ? 1 : 0

  const turnstileAction = calendarFirst
    ? step === 1
      ? TURNSTILE_ACTIONS.INTAKE_HOLD
      : step === 2
        ? TURNSTILE_ACTIONS.INTAKE_LEAD
        : TURNSTILE_ACTIONS.INTAKE_SUBMIT
    : step === 1
      ? TURNSTILE_ACTIONS.INTAKE_LEAD
      : TURNSTILE_ACTIONS.INTAKE_SUBMIT

  useEffect(() => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }, [step])

  const slotsQuery = useQuery({
    queryKey: ['public-service-slots', firmSlug, serviceSlug],
    queryFn: () => contabilPublicApi.getPublicSlots(firmSlug!, serviceSlug!),
    enabled: Boolean(
      firmSlug &&
        serviceSlug &&
        query.data?.requiresBooking &&
        (calendarFirst ? step === calendarStep : step === 2),
    ),
    retry: false,
  })

  useEffect(() => {
    const theme = query.data?.theme
    if (!theme) return
    applyFirmBranding({
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      textColor: theme.textColor,
      backgroundColor: theme.backgroundColor,
      surfaceColor: theme.surfaceColor,
      mutedTextColor: theme.mutedTextColor,
    })
    return () => {
      applyFirmBranding(null)
    }
  }, [query.data?.theme])

  useEffect(() => {
    if (!holdExpiresAt) return
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [holdExpiresAt])

  const holdExpired = Boolean(holdExpiresAt && new Date(holdExpiresAt).getTime() <= nowMs)

  useEffect(() => {
    if (!calendarFirst || !holdExpired || step === 1) return
    setHoldToken('')
    setHoldExpiresAt(null)
    setScheduledAt('')
    setStep(1)
    toast.error('A reserva temporária expirou. Escolha o horário novamente.')
    void queryClient.invalidateQueries({ queryKey: ['public-service-slots', firmSlug, serviceSlug] })
  }, [calendarFirst, holdExpired, step, firmSlug, serviceSlug, queryClient])

  const setAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const needsLegal = Boolean(query.data?.termsText || query.data?.privacyText)

  async function onHoldSlot(e: FormSubmitEvent) {
    e.preventDefault()
    if (!scheduledAt) {
      toast.error('Escolha um horário')
      return
    }
    setSubmitting(true)
    try {
      const res = await contabilPublicApi.holdPublicSlot(
        firmSlug!,
        serviceSlug!,
        withTurnstileToken({ scheduledAt, website: website || undefined }, turnstileToken),
      )
      setHoldToken(res.holdToken)
      setHoldExpiresAt(res.expiresAt)
      setScheduledAt(res.scheduledAt || scheduledAt)
      setStep(2)
    } catch (err) {
      turnstileRef.current?.reset()
      setTurnstileToken('')
      setScheduledAt('')
      void queryClient.invalidateQueries({ queryKey: ['public-service-slots', firmSlug, serviceSlug] })
      toast.error('Não foi possível reservar este horário', { description: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  async function onCaptureLead(e: FormSubmitEvent) {
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
      const res = await contabilPublicApi.captureServiceLead(
        firmSlug!,
        serviceSlug!,
        withTurnstileToken(
          {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            taxId: taxId.trim() || undefined,
            website: website || undefined,
          },
          turnstileToken,
        ),
      )
      setLeadAccessToken(res.intakeToken)
      setStep(calendarFirst ? 3 : 2)
    } catch (err) {
      turnstileRef.current?.reset()
      setTurnstileToken('')
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
    if (calendarFirst && !holdToken) {
      toast.error('A reserva temporária expirou. Escolha o horário novamente.')
      setStep(1)
      return
    }
    setSubmitting(true)
    try {
      const res = await contabilPublicApi.submitServiceIntake(
        firmSlug!,
        serviceSlug!,
        withTurnstileToken(
          {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            taxId: taxId.trim() || undefined,
            answers,
            website: website || undefined,
            scheduledAt: scheduledAt || undefined,
            holdToken: calendarFirst ? holdToken || undefined : undefined,
            intakeToken: leadAccessToken || undefined,
          },
          turnstileToken,
        ),
      )
      if (res.checkoutUrl) {
        const opened = openExternalUrl(res.checkoutUrl)
        if (opened) {
          toast.message('Pagamento noutra aba', {
            description: 'Conclua o pagamento na nova aba. Esta página mantém-se aberta.',
          })
        }
        setResult(res)
        return
      }
      setResult(res)
    } catch (err) {
      turnstileRef.current?.reset()
      setTurnstileToken('')
      toast.error('Não foi possível enviar o pedido', { description: getErrorMessage(err) })
      if (query.data?.requiresBooking) {
        if (calendarFirst) {
          setHoldToken('')
          setHoldExpiresAt(null)
          setScheduledAt('')
          setStep(1)
        } else {
          setScheduledAt('')
        }
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
  const formHandler = calendarFirst ? (step === 1 ? onHoldSlot : step === 2 ? onCaptureLead : onSubmit) : step === 1 ? onCaptureLead : onSubmit

  if (result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-border/50 bg-card p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <h1 className="text-lg font-semibold text-[hsl(var(--brand-text,var(--foreground)))]">
            Obrigado, recebemos o seu pedido
          </h1>
          <p className="text-sm text-muted-foreground">
            A nossa equipa vai analisar e entrar em contacto consigo em breve.
          </p>
          {result.scheduledAt ? (
            <p className="rounded-lg border border-border/50 bg-muted/40 p-3 text-sm font-medium text-foreground">
              {result.bookingConfirmed
                ? `Horário registado: ${formatScheduledAt(result.scheduledAt)}. A equipa confirmará o agendamento em breve.`
                : `Preferência de horário registada: ${formatScheduledAt(result.scheduledAt)}. Este horário será analisado e confirmado pela equipa.`}
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  // Oferta composta: o cliente escolhe uma opção real; o booking usa o service_id do filho.
  if (service.hasOptions && (service.options?.length || 0) > 0) {
    return (
      <div className="mx-auto min-h-screen max-w-xl bg-background px-4 py-10">
        <header className="mb-6 space-y-2">
          {service.logoUrl ? (
            <img
              src={service.logoUrl}
              alt={service.firmName || ''}
              className="mb-2 h-10 w-auto max-w-[200px] object-contain"
            />
          ) : (
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{service.firmName}</p>
          )}
          {service.imageUrl ? (
            <div className="mb-3 h-48 w-full overflow-hidden rounded-xl">
              <img src={service.imageUrl} alt="" className="h-full w-full" style={servicePositionedImageStyle(service)} />
            </div>
          ) : null}
          <h1 className="text-2xl font-bold text-[hsl(var(--brand-text,var(--foreground)))]">{service.serviceName}</h1>
          {service.description ? (
            <SanitizedServiceHtml html={service.description} className="text-sm text-muted-foreground" />
          ) : null}
        </header>

        <section className="space-y-3 rounded-2xl border border-border/50 bg-card p-6 shadow-sm" data-testid="service-offer-options">
          <div>
            <h2 className="text-base font-semibold text-foreground">Escolha o tipo de serviço que pretende</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cada opção tem o seu preço, duração e disponibilidade. Depois de escolher, continua o pedido
              nessa modalidade.
            </p>
          </div>
          <ul className="space-y-2">
            {service.options!.map((opt) => (
              <li key={opt.slug}>
                <Link
                  to={`/${encodeURIComponent(firmSlug!)}/servicos/${encodeURIComponent(opt.slug)}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 transition hover:border-primary/40 hover:shadow-sm"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">{opt.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {opt.durationMinutes} min
                      {opt.requiresBooking ? ' · com agendamento' : ''}
                    </span>
                  </span>
                  {service.showPrices !== false && opt.priceCents > 0 ? (
                    <span className="shrink-0 text-sm font-semibold text-[hsl(var(--brand-text,var(--primary)))]">
                      {(opt.priceCents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <TeglionPublicCredit visible={service.showTeglionCredit} />
      </div>
    )
  }

  const identityFields = (
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
          <PhoneNumberInput
            defaultCountry="PT"
            value={phone || undefined}
            onChange={(v) => setPhone(v || '')}
            placeholder="+351 …"
            className="h-10 rounded-lg"
            inputClassName="h-10 rounded-lg"
          />
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
    </>
  )

  const questionsFields = service.intakeForm.questions.map((q, index) => (
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
  ))

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-background px-4 py-10">
      <header className="mb-6 space-y-2">
        {service.logoUrl ? (
          <img src={service.logoUrl} alt={service.firmName || ''} className="mb-2 h-10 w-auto max-w-[200px] object-contain" />
        ) : (
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{service.firmName}</p>
        )}
        {service.imageUrl ? (
          <div className="mb-3 h-48 w-full overflow-hidden rounded-xl">
            <img src={service.imageUrl} alt="" className="h-full w-full" style={servicePositionedImageStyle(service)} />
          </div>
        ) : null}
        <h1 className="text-2xl font-bold text-[hsl(var(--brand-text,var(--foreground)))]">{service.serviceName}</h1>
        {service.description ? <SanitizedServiceHtml html={service.description} className="text-sm text-muted-foreground" /> : null}
        {service.showPrices !== false && (service.priceCents ?? 0) > 0 ? (
          <div>
            <p className="text-sm font-semibold text-[hsl(var(--brand-text,var(--primary)))]">
              {((service.priceCents || 0) / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </p>
            {priceTaxModeCaption(service.priceTaxMode) ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{priceTaxModeCaption(service.priceTaxMode)}</p>
            ) : null}
          </div>
        ) : null}
      </header>

      <form onSubmit={formHandler} className="space-y-5 rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
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

        <p className="text-xs font-medium text-muted-foreground">
          Etapa {step} de {totalSteps}
        </p>

        {calendarFirst && holdExpiresAt && step > 1 && scheduledAt ? (
          <p className="rounded-lg border border-border/50 bg-muted/40 p-3 text-sm">
            Horário reservado: {formatScheduledAt(scheduledAt)}.
            <span className="mt-1 block text-xs text-muted-foreground">
              Esta reserva temporária expira às{' '}
              {new Date(holdExpiresAt).toLocaleTimeString('pt-PT', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Lisbon',
              })}
              .
            </span>
          </p>
        ) : null}

        {step === identityStep ? identityFields : null}

        {calendarFirst && step === 1 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Escolha um horário *</p>
            <PublicSlotCalendar
              slots={slotsQuery.data?.slots ?? []}
              loading={slotsQuery.isLoading}
              value={scheduledAt}
              onChange={setScheduledAt}
            />
          </div>
        ) : null}

        {!calendarFirst && step === 2 && service.requiresBooking ? (
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

        {step === questionsStep ? questionsFields : null}

        <TurnstileField
          key={turnstileAction}
          fieldRef={turnstileRef}
          action={turnstileAction}
          onTokenChange={setTurnstileToken}
        />

        {step === 1 ? (
          <Button type="submit" className="w-full rounded-full" disabled={submitting || !turnstileOk}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Continuar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => setStep((s) => Math.max(1, s - 1))}>
              Voltar
            </Button>
            <Button type="submit" className="flex-1 rounded-full" disabled={submitting || !turnstileOk}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {step === questionsStep
                ? service.paymentRequired
                  ? 'Continuar para pagamento'
                  : 'Enviar pedido'
                : 'Continuar'}
            </Button>
          </div>
        )}
        {step === questionsStep && service.paymentRequired ? (
          <p className="text-center text-xs text-muted-foreground">
            O horário fica reservado 30 minutos enquanto conclui o pagamento seguro na Stripe.
          </p>
        ) : null}
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
      <TeglionPublicCredit visible={service.showTeglionCredit !== false} />
    </div>
  )
}
