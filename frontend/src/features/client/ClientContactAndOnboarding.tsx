import { useState } from 'react'
import { MessageCircle, Phone, X } from 'lucide-react'

import { trackProductEvent } from '@/shared/utils/productAnalytics'
import { cn } from '@/shared/lib/utils'

function whatsAppHref(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, '')
  const q = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${digits}${q}`
}

type Props = {
  firmName: string
  contactPhone?: string | null
  onGoMessages: () => void
  onGoBooking: () => void
  className?: string
}

/** CTA permanente para contactar o escritório (WhatsApp / telefone / mensagens). */
export function ClientContactFirmCta({
  firmName,
  contactPhone,
  onGoMessages,
  onGoBooking,
  className,
}: Props) {
  const phone = contactPhone?.trim() || ''
  const wa = phone ? whatsAppHref(phone, `Olá, sou cliente de ${firmName} via Teglion.`) : null

  return (
    <section
      className={cn(
        'rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/[0.05] to-card p-4',
        className,
      )}
    >
      <p className="cb-text-label text-brand">Contactar o escritório</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Mais rápido que email — fale connosco pelo canal que preferir.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => trackProductEvent('client_whatsapp_click', { firm: firmName })}
            aria-label="Abrir WhatsApp do escritório"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            WhatsApp
          </a>
        ) : null}
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Ligar para o escritório"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            Ligar
          </a>
        ) : null}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onGoMessages}
        >
          Mensagem no portal
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onGoBooking}
        >
          Agendar reunião
        </button>
      </div>
      {!phone ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          O escritório ainda não publicou telefone — use mensagens ou agende uma reunião.
        </p>
      ) : null}
    </section>
  )
}

const ONBOARD_KEY = 'teglion-client-onboarding-v1'

export function ClientFirstVisitOnboarding({
  onGoDocuments,
  onGoObligations,
  onGoMessages,
  onInstallHint,
}: {
  onGoDocuments: () => void
  onGoObligations: () => void
  onGoMessages: () => void
  onInstallHint?: () => void
}) {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(ONBOARD_KEY) !== '1'
    } catch {
      return false
    }
  })

  if (!open) return null

  const dismiss = () => {
    setOpen(false)
    try {
      localStorage.setItem(ONBOARD_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="relative rounded-2xl border border-border bg-card p-4 shadow-sm">
      <button
        type="button"
        className="absolute right-2 top-2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Fechar introdução"
        onClick={dismiss}
      >
        <X className="h-4 w-4" />
      </button>
      <p className="pr-8 text-sm font-semibold text-foreground">Bem-vindo ao portal</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Em menos de um minuto: envie documentos, veja prazos e fale com o escritório.
      </p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2">
        {[
          { label: 'Enviar documentos', onClick: onGoDocuments },
          { label: 'Ver prazos / agenda', onClick: onGoObligations },
          { label: 'Falar com o escritório', onClick: onGoMessages },
          ...(onInstallHint
            ? [{ label: 'Instalar a app', onClick: onInstallHint }]
            : []),
        ].map((step) => (
          <li key={step.label}>
            <button
              type="button"
              className="w-full rounded-xl border border-border/80 bg-muted/20 px-3 py-2.5 text-left text-xs font-semibold text-foreground transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                step.onClick()
                dismiss()
              }}
            >
              {step.label}
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
