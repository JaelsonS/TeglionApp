import { useState } from 'react'
import { CalendarCheck, MessageSquare, X } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

type Props = {
  firmName: string
  onGoMessages: () => void
  onGoBooking: () => void
  className?: string
}

/** Contacto do escritório — apenas canais dentro do Teglion. */
export function ClientContactFirmCta({ firmName, onGoMessages, onGoBooking, className }: Props) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/[0.05] to-card p-4',
        className,
      )}
    >
      <p className="cb-text-label text-brand">Falar com {firmName}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Mensagens e reuniões ficam no Teglion — sem sair da aplicação.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onGoMessages}
          aria-label="Abrir mensagens com o escritório"
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
          Enviar mensagem
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onGoBooking}
          aria-label="Agendar reunião com o escritório"
        >
          <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
          Agendar reunião
        </button>
      </div>
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
        Envie documentos, veja a agenda e fale com o escritório — tudo aqui.
      </p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2">
        {[
          { label: 'Enviar documentos', onClick: onGoDocuments },
          { label: 'Ver agenda fiscal', onClick: onGoObligations },
          { label: 'Mensagem ao escritório', onClick: onGoMessages },
          ...(onInstallHint ? [{ label: 'Instalar a app', onClick: onInstallHint }] : []),
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
