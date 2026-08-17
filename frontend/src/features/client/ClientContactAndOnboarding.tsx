import { useState } from 'react'
import { CalendarCheck, MessageSquare, X } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

type Props = {
  firmName: string
  onGoMessages: () => void
  onGoBooking: () => void
  className?: string
}

/** Contacto do escritório — mensagens e consultoria. */
export function ClientContactFirmCta({ firmName, onGoMessages, onGoBooking, className }: Props) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/[0.05] to-card p-4',
        className,
      )}
    >
      <p className="cb-text-label text-brand">Precisa de ajuda?</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Escreva ao {firmName} ou marque uma consultoria — o que for mais fácil para si.
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
          aria-label="Ver serviços do escritório"
        >
          <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
          Ver serviços
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
    <section className="relative rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
      <button
        type="button"
        className="absolute right-1.5 top-1.5 rounded-lg p-1.5 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Fechar introdução"
        onClick={dismiss}
      >
        <X className="h-4 w-4" />
      </button>
      <p className="pr-8 text-sm font-semibold text-foreground">Primeiros passos</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Documentos, prazos e mensagens — tudo no mesmo sítio.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          { label: 'Enviar documentos', onClick: onGoDocuments },
          { label: 'Ver prazos', onClick: onGoObligations },
          { label: 'Mensagem ao escritório', onClick: onGoMessages },
          ...(onInstallHint ? [{ label: 'Instalar a app', onClick: onInstallHint }] : []),
        ].map((step) => (
          <button
            key={step.label}
            type="button"
            className="rounded-full border border-border/80 bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-brand/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              step.onClick()
              dismiss()
            }}
          >
            {step.label}
          </button>
        ))}
      </div>
    </section>
  )
}
