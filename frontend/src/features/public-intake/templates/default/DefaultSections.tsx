import { Link } from 'react-router-dom'
import {
  CalendarClock,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react'

import type {
  PublicSiteAboutContent,
  PublicSiteConfig,
  PublicSiteContactContent,
  PublicSiteFaqContent,
  PublicSiteFeaturesContent,
  PublicSiteHeroContent,
  PublicSiteProcessContent,
  PublicSiteServicesContent,
  PublicSiteSocialLinks,
} from '@/shared/types/firmPublicSite'

function resolveFirstImageUrl(imageIds: string[], images: PublicSiteConfig['images']): string | null {
  const id = imageIds[0]
  if (!id) return null
  const found = [...images.hero, ...images.institutional].find((img) => img.id === id)
  return found?.url || null
}
import type { PublicFirmServiceSummary } from '@/infrastructure/api/contabil/public'
import { SanitizedServiceHtml } from '@/shared/design-system/SanitizedServiceHtml'

/**
 * Contexto partilhado por todas as secções — dados que não vivem no
 * `content` da secção porque são derivados ao vivo (catálogo real de
 * serviços) ou vêm de outra parte da configuração (tema/branding, contacto).
 * O mesmo conjunto de componentes é usado pelo painel de pré-visualização do
 * editor (Fase 3) e pela página pública real (Fase 4) — nunca diverge.
 */
export type PublicSiteRenderContext = {
  firmSlug: string
  firmName: string
  logoUrl: string | null
  services: PublicFirmServiceSummary[]
  contact: { email: string | null; phone: string | null; address: string | null }
  showPrices?: boolean
  complaintsBookUrl?: string | null
  complaintsBookLabel?: string | null
  praiseUrl?: string | null
  praiseLabel?: string | null
  /** @deprecated */
  praiseContact?: string | null
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}

function resolveCtaHref(cta: PublicSiteHeroContent['ctas'][number], ctx: PublicSiteRenderContext, socialLinks: PublicSiteSocialLinks) {
  switch (cta.target.type) {
    case 'booking':
    case 'service-detail':
      return cta.target.serviceId
        ? `/${encodeURIComponent(ctx.firmSlug)}/servicos/${encodeURIComponent(cta.target.serviceId)}`
        : '#servicos'
    case 'whatsapp':
      return socialLinks.whatsapp || '#contactos'
    case 'contact-form':
      return '#contactos'
    case 'external-url':
      return cta.target.url || '#'
    default:
      return '#'
  }
}

export function HeaderSection({ ctx }: { ctx: PublicSiteRenderContext }) {
  return (
    <header className="border-b border-primary/20 bg-primary/5">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
        <span className="font-semibold text-[hsl(var(--brand-text,var(--primary)))]">
          {ctx.firmName}
        </span>
      </div>
    </header>
  )
}

export function HeroSection({
  content,
  ctx,
  socialLinks,
  images,
}: {
  content: PublicSiteHeroContent
  ctx: PublicSiteRenderContext
  socialLinks: PublicSiteSocialLinks
  images: PublicSiteConfig['images']
}) {
  const heroPhotoUrl = resolveFirstImageUrl(content.imageIds, images)
  return (
    <section className="border-b border-border/40 bg-gradient-to-b from-primary/10 to-card/40">
      {heroPhotoUrl ? (
        <img src={heroPhotoUrl} alt={ctx.firmName} className="h-48 w-full object-cover sm:h-64" />
      ) : null}
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        {ctx.logoUrl ? (
          <img
            src={ctx.logoUrl}
            alt={ctx.firmName}
            className="mx-auto mb-4 h-20 w-20 rounded-full border-2 border-primary/30 object-cover shadow-sm"
          />
        ) : null}
        <h1 className="text-2xl font-bold text-[hsl(var(--brand-text,var(--primary)))]">{ctx.firmName}</h1>
        {content.tagline ? (
          <p className="mt-2 text-base text-[hsl(var(--brand-text,var(--primary)))]">{content.tagline}</p>
        ) : null}
        {content.bio ? <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">{content.bio}</p> : null}
        {content.ctas.length > 0 ? (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {content.ctas.map((cta) => (
              <a
                key={cta.id}
                href={resolveCtaHref(cta, ctx, socialLinks)}
                target={cta.target.type === 'external-url' || cta.target.type === 'whatsapp' ? '_blank' : undefined}
                rel="noopener noreferrer"
                className={
                  cta.style === 'secondary'
                    ? 'inline-flex items-center rounded-lg border-2 border-secondary bg-secondary/15 px-4 py-2 text-sm font-medium text-[hsl(var(--secondary))] transition hover:bg-secondary/25'
                    : 'inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90'
                }
              >
                {cta.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function AboutSection({ content, images }: { content: PublicSiteAboutContent; images: PublicSiteConfig['images'] }) {
  if (!content.heading && !content.body) return null
  const photoUrl = resolveFirstImageUrl(content.imageIds, images)
  return (
    <section className="mx-auto max-w-2xl space-y-3 px-4 py-6">
      {photoUrl ? <img src={photoUrl} alt="" loading="lazy" className="w-full rounded-xl object-cover" /> : null}
      {content.heading ? <h2 className="text-lg font-semibold">{content.heading}</h2> : null}
      {content.body ? <p className="whitespace-pre-line text-sm text-muted-foreground">{content.body}</p> : null}
    </section>
  )
}

function ServiceCard({
  firmSlug,
  service,
  showPrices = true,
}: {
  firmSlug: string
  service: PublicFirmServiceSummary
  showPrices?: boolean
}) {
  return (
    <Link
      to={`/${encodeURIComponent(firmSlug)}/servicos/${encodeURIComponent(service.slug)}`}
      className="block overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition hover:border-primary/40 hover:shadow-md"
    >
      {service.imageUrl ? (
        <img src={service.imageUrl} alt="" className="h-36 w-full object-cover" loading="lazy" />
      ) : null}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold">{service.name}</h3>
            {service.description ? (
              <SanitizedServiceHtml html={service.description} className="mt-1 line-clamp-2 text-sm" />
            ) : null}
          </div>
          {showPrices && service.priceCents > 0 ? (
            <span className="shrink-0 text-sm font-semibold text-[hsl(var(--brand-text,var(--primary)))]">
              {formatPrice(service.priceCents)}
            </span>
          ) : null}
        </div>
        {service.requiresBooking ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" /> {service.durationMinutes} min · com agendamento
          </p>
        ) : null}
      </div>
    </Link>
  )
}

export function ServicesSection({ content, ctx }: { content: PublicSiteServicesContent; ctx: PublicSiteRenderContext }) {
  const items = ctx.services.filter((s) => s.requiresBooking)
  if (items.length === 0) return null
  return (
    <section id="servicos" className="mx-auto max-w-2xl space-y-3 px-4 py-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{content.heading || 'Consultorias com agendamento'}</h2>
      <ul className="space-y-3">
        {items.map((s) => (
          <li key={s.slug}>
            <ServiceCard firmSlug={ctx.firmSlug} service={s} showPrices={ctx.showPrices !== false} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function BookingServicesSection({ content, ctx }: { content: PublicSiteServicesContent; ctx: PublicSiteRenderContext }) {
  const items = ctx.services.filter((s) => !s.requiresBooking)
  if (items.length === 0) return null
  return (
    <section className="mx-auto max-w-2xl space-y-3 px-4 py-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{content.heading || 'Outros serviços'}</h2>
      <ul className="space-y-3">
        {items.map((s) => (
          <li key={s.slug}>
            <ServiceCard firmSlug={ctx.firmSlug} service={s} showPrices={ctx.showPrices !== false} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function FeaturesSection({ content }: { content: PublicSiteFeaturesContent }) {
  if (content.items.length === 0) return null
  return (
    <section className="mx-auto max-w-2xl space-y-3 px-4 py-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {content.items.map((it) => (
          <div key={it.id} className="rounded-xl border border-border/50 bg-card p-4">
            <h3 className="text-sm font-semibold">{it.title}</h3>
            {it.description ? <p className="mt-1 text-sm text-muted-foreground">{it.description}</p> : null}
          </div>
        ))}
      </div>
    </section>
  )
}

export function ProcessSection({ content }: { content: PublicSiteProcessContent }) {
  if (content.steps.length === 0) return null
  return (
    <section className="mx-auto max-w-2xl space-y-3 px-4 py-6">
      <ol className="space-y-3">
        {content.steps.map((step, index) => (
          <li key={step.id} className="flex gap-3 rounded-xl border border-border/50 bg-card p-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <div>
              <h3 className="text-sm font-semibold">{step.title}</h3>
              {step.description ? <p className="mt-1 text-sm text-muted-foreground">{step.description}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function FaqSection({ content }: { content: PublicSiteFaqContent }) {
  if (content.items.length === 0) return null
  return (
    <section className="mx-auto max-w-2xl space-y-3 px-4 py-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Perguntas frequentes</h2>
      <div className="space-y-2">
        {content.items.map((faq) => (
          <details key={faq.id} className="group rounded-xl border border-border/50 bg-card p-4">
            <summary className="cursor-pointer list-none text-sm font-medium marker:content-none">{faq.question}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export function ContactSection({ content, ctx }: { content: PublicSiteContactContent; ctx: PublicSiteRenderContext }) {
  const rows = [
    content.showEmail && ctx.contact.email ? { key: 'email', icon: Mail, label: ctx.contact.email, href: `mailto:${ctx.contact.email}` } : null,
    content.showPhone && ctx.contact.phone ? { key: 'phone', icon: Phone, label: ctx.contact.phone, href: null } : null,
    content.showAddress && ctx.contact.address ? { key: 'address', icon: MapPin, label: ctx.contact.address, href: null } : null,
  ].filter((r): r is NonNullable<typeof r> => Boolean(r))
  if (rows.length === 0) return null
  return (
    <section id="contactos" className="mx-auto max-w-2xl space-y-2 px-4 py-6 text-center text-sm text-muted-foreground">
      {rows.map(({ key, icon: Icon, label, href }) =>
        href ? (
          <a key={key} href={href} className="flex items-center justify-center gap-1.5 hover:text-foreground">
            <Icon className="h-3.5 w-3.5" /> {label}
          </a>
        ) : (
          <p key={key} className="flex items-center justify-center gap-1.5">
            <Icon className="h-3.5 w-3.5" /> {label}
          </p>
        ),
      )}
    </section>
  )
}

export function FooterSection({ ctx, socialLinks }: { ctx: PublicSiteRenderContext; socialLinks: PublicSiteSocialLinks }) {
  const entries = [
    { key: 'instagram', href: socialLinks.instagram, label: 'Instagram', Icon: Instagram },
    { key: 'facebook', href: socialLinks.facebook, label: 'Facebook', Icon: Facebook },
    { key: 'linkedin', href: socialLinks.linkedin, label: 'LinkedIn', Icon: Linkedin },
    { key: 'whatsapp', href: socialLinks.whatsapp, label: 'WhatsApp', Icon: MessageCircle },
    { key: 'website', href: socialLinks.website, label: 'Site', Icon: Globe },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href))
  return (
    <footer className="border-t border-border/40 bg-card/40">
      {entries.length > 0 ? (
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-3 px-4 py-8">
          {entries.map(({ key, href, label, Icon }) => (
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
      ) : (
        <div className="pt-6" />
      )}
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 px-4 pb-6 text-center text-xs text-muted-foreground/80">
        {ctx.complaintsBookUrl ? (
          <a
            href={ctx.complaintsBookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {ctx.complaintsBookLabel?.trim() || 'Livro de Reclamações'}
          </a>
        ) : null}
        {ctx.praiseUrl ? (
          <a
            href={ctx.praiseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {ctx.praiseLabel?.trim() || 'Deixe a sua avaliação'}
          </a>
        ) : ctx.praiseContact ? (
          <p>{ctx.praiseContact}</p>
        ) : null}
        <p className="text-muted-foreground/70">{ctx.firmName}</p>
      </div>
    </footer>
  )
}
