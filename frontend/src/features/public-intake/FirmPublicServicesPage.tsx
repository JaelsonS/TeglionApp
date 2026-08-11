import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarClock,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react'

import { contabilPublicApi } from '@/infrastructure/api'
import { applyFirmBranding } from '@/shared/utils/firmBranding'
import type { PublicFirmServiceSummary } from '@/infrastructure/api/contabil/public'

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}

function ServiceCard({ firmSlug, service }: { firmSlug: string; service: PublicFirmServiceSummary }) {
  return (
    <Link
      to={`/${encodeURIComponent(firmSlug)}/servicos/${encodeURIComponent(service.slug)}`}
      className="block rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">{service.name}</h3>
          {service.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
          ) : null}
        </div>
        {service.priceCents > 0 ? (
          <span className="shrink-0 text-sm font-semibold text-primary">{formatPrice(service.priceCents)}</span>
        ) : null}
      </div>
      {service.requiresBooking ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" /> {service.durationMinutes} min · com agendamento
        </p>
      ) : null}
    </Link>
  )
}

/**
 * Página pública unificada de um escritório (`/:firmSlug`) — landing page
 * completa: hero (foto/logo, tagline, bio), serviços agrupados por
 * "precisa de agendamento" (consultorias) vs "outros serviços" (entregas
 * pontuais), FAQ e contactos/redes sociais. Todo o conteúdo vem de
 * Definições → Página pública + do catálogo de Serviços já activados —
 * nada aqui é hardcoded por escritório.
 */
export function FirmPublicServicesPage() {
  const { firmSlug = '' } = useParams()

  const query = useQuery({
    queryKey: ['public-firm-services', firmSlug],
    queryFn: () => contabilPublicApi.getPublicFirmServices(firmSlug),
    retry: false,
  })

  useEffect(() => {
    if (query.data) {
      applyFirmBranding({ primaryColor: query.data.primaryColor, secondaryColor: query.data.secondaryColor })
    }
    return () => applyFirmBranding(null)
  }, [query.data])

  if (query.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="text-lg font-semibold">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verifique o link recebido — pode estar incompleto ou já não existir.
        </p>
      </div>
    )
  }

  const { firmName, logoUrl, tagline, bio, socialLinks, faqs, contact, items } = query.data
  const withBooking = items.filter((s) => s.requiresBooking)
  const withoutBooking = items.filter((s) => !s.requiresBooking)
  const socialEntries = [
    { key: 'instagram', href: socialLinks.instagram, label: 'Instagram', Icon: Instagram },
    { key: 'facebook', href: socialLinks.facebook, label: 'Facebook', Icon: Facebook },
    { key: 'linkedin', href: socialLinks.linkedin, label: 'LinkedIn', Icon: Linkedin },
    { key: 'whatsapp', href: socialLinks.whatsapp, label: 'WhatsApp', Icon: MessageCircle },
    { key: 'website', href: socialLinks.website, label: 'Site', Icon: Globe },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href))
  const hasContactRow = Boolean(contact.email || contact.phone || contact.address)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card/40">
        <div className="mx-auto max-w-2xl px-4 py-10 text-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={firmName}
              className="mx-auto mb-4 h-20 w-20 rounded-full border border-border/50 object-cover shadow-sm"
            />
          ) : null}
          <h1 className="text-2xl font-bold">{firmName}</h1>
          {tagline ? <p className="mt-2 text-base text-primary">{tagline}</p> : null}
          {bio ? <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">{bio}</p> : null}
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-10 px-4 py-10">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            Ainda não há serviços disponíveis aqui.
          </div>
        ) : (
          <>
            {withBooking.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Consultorias com agendamento
                </h2>
                <ul className="space-y-3">
                  {withBooking.map((s) => (
                    <li key={s.slug}>
                      <ServiceCard firmSlug={firmSlug} service={s} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {withoutBooking.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Outros serviços
                </h2>
                <ul className="space-y-3">
                  {withoutBooking.map((s) => (
                    <li key={s.slug}>
                      <ServiceCard firmSlug={firmSlug} service={s} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}

        {faqs.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Perguntas frequentes
            </h2>
            <div className="space-y-2">
              {faqs.map((faq) => (
                <details key={faq.id} className="group rounded-xl border border-border/50 bg-card p-4">
                  <summary className="cursor-pointer list-none text-sm font-medium marker:content-none">
                    {faq.question}
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      {(socialEntries.length > 0 || hasContactRow) && (
        <footer className="border-t border-border/40 bg-card/40">
          <div className="mx-auto max-w-2xl space-y-4 px-4 py-8 text-center">
            {socialEntries.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {socialEntries.map(({ key, href, label, Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            ) : null}
            {hasContactRow ? (
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                    <Mail className="h-3.5 w-3.5" /> {contact.email}
                  </a>
                ) : null}
                {contact.phone ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {contact.phone}
                  </span>
                ) : null}
                {contact.address ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {contact.address}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </footer>
      )}
    </div>
  )
}
