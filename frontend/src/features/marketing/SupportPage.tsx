import { useState } from 'react'
import { Loader2, Mail, MessageCircle, Phone } from 'lucide-react'
import { toast } from 'sonner'

import { FadeInView } from '@/shared/components/landing/FadeInView'
import { LandingMarketingShell } from '@/shared/components/landing/LandingMarketingShell'
import { BRAND } from '@/shared/config/brand'
import { contabilPublicApi } from '@/infrastructure/api'

const CHANNELS = [
  {
    icon: Phone,
    label: 'Telefone',
    value: BRAND.phone.display,
    href: `tel:${BRAND.phone.e164}`,
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: BRAND.phone.display,
    href: BRAND.phone.whatsapp,
  },
  {
    icon: Mail,
    label: 'E-mail',
    value: BRAND.emails.support,
    href: `mailto:${BRAND.emails.support}`,
  },
] as const

type FormState = {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

const EMPTY_FORM: FormState = { name: '', email: '', phone: '', subject: '', message: '' }

export function SupportPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || form.message.trim().length < 10) {
      toast.error('Preencha nome, e-mail e descreva o problema (mín. 10 caracteres).')
      return
    }
    setLoading(true)
    try {
      await contabilPublicApi.sendSupportRequest({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
      })
      toast.success('Mensagem enviada! Vamos responder o mais rápido possível.')
      setForm(EMPTY_FORM)
    } catch {
      toast.error('Não foi possível enviar. Tente novamente ou contacte-nos por telefone/e-mail.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LandingMarketingShell
      title={`Atendimento ao cliente | ${BRAND.name}`}
      description="Fale com a equipa Teglion por telefone, WhatsApp, e-mail ou pelo formulário de suporte."
      path="/suporte"
    >
      <section className="landing-section pb-0">
        <div className="landing-container">
          <FadeInView className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#C9932E]">Atendimento ao cliente</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#0F2942] sm:text-4xl md:text-5xl">Como podemos ajudar?</h1>
            <p className="mt-3 text-base text-[#4A5568] sm:mt-4 sm:text-lg">
              Fale connosco directamente ou envie os detalhes do seu problema — respondemos o mais rápido possível.
            </p>
          </FadeInView>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-container">
          <FadeInView className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
            {CHANNELS.map((channel) => {
              const Icon = channel.icon
              return (
                <a
                  key={channel.label}
                  href={channel.href}
                  target={channel.href.startsWith('http') ? '_blank' : undefined}
                  rel={channel.href.startsWith('http') ? 'noreferrer' : undefined}
                  className="landing-card flex flex-col items-center gap-2 p-6 text-center transition hover:-translate-y-0.5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F2942]/5 text-[#0F2942]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-[#0F2942]">{channel.label}</span>
                  <span className="text-sm text-[#4A5568]">{channel.value}</span>
                </a>
              )
            })}
          </FadeInView>

          <FadeInView className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[#0F2942]/10 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[#0F2942]">Enviar um pedido de suporte</h2>
            <p className="mt-2 text-sm text-[#4A5568]">
              Descreva o problema com o máximo de detalhe possível. Respondemos por e-mail.
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-[#0F2942]" htmlFor="support-name">
                    Nome
                  </label>
                  <input
                    id="support-name"
                    type="text"
                    autoComplete="name"
                    required
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    disabled={loading}
                    className="mt-1.5 w-full rounded-lg border border-[#0F2942]/15 px-3 py-2 text-sm outline-none focus:border-[#0F2942]/40"
                    placeholder="O seu nome"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0F2942]" htmlFor="support-email">
                    E-mail
                  </label>
                  <input
                    id="support-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    disabled={loading}
                    className="mt-1.5 w-full rounded-lg border border-[#0F2942]/15 px-3 py-2 text-sm outline-none focus:border-[#0F2942]/40"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-[#0F2942]" htmlFor="support-phone">
                    Telefone <span className="text-[#4A5568]">(opcional)</span>
                  </label>
                  <input
                    id="support-phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    disabled={loading}
                    className="mt-1.5 w-full rounded-lg border border-[#0F2942]/15 px-3 py-2 text-sm outline-none focus:border-[#0F2942]/40"
                    placeholder="+351 9XX XXX XXX"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0F2942]" htmlFor="support-subject">
                    Assunto <span className="text-[#4A5568]">(opcional)</span>
                  </label>
                  <input
                    id="support-subject"
                    type="text"
                    value={form.subject}
                    onChange={(e) => update('subject', e.target.value)}
                    disabled={loading}
                    className="mt-1.5 w-full rounded-lg border border-[#0F2942]/15 px-3 py-2 text-sm outline-none focus:border-[#0F2942]/40"
                    placeholder="Ex.: Problema ao criar tarefa"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#0F2942]" htmlFor="support-message">
                  Descreva o problema
                </label>
                <textarea
                  id="support-message"
                  required
                  minLength={10}
                  rows={5}
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  disabled={loading}
                  className="mt-1.5 w-full rounded-lg border border-[#0F2942]/15 px-3 py-2 text-sm outline-none focus:border-[#0F2942]/40"
                  placeholder="O que aconteceu, quando, e o que esperava que acontecesse..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="landing-btn-primary inline-flex w-full items-center justify-center gap-2 px-8 py-3 disabled:opacity-60 sm:w-auto"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                Enviar mensagem
              </button>
            </form>
          </FadeInView>
        </div>
      </section>
    </LandingMarketingShell>
  )
}
