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
  PublicSiteChromeContent,
  PublicSiteConfig,
  PublicSiteContactContent,
  PublicSiteFaqContent,
  PublicSiteFeaturesContent,
  PublicSiteHeroContent,
  PublicSiteProcessContent,
  PublicSiteServicesContent,
  PublicSiteSocialLinks,
} from '@/shared/types/firmPublicSite'
import type { PublicFirmServiceSummary } from '@/infrastructure/api/contabil/public'
import { PublicSiteHeroBanner } from '@/features/public-intake/PublicSiteHeroBanner'
import { SanitizedServiceHtml } from '@/shared/design-system/SanitizedServiceHtml'
import { priceTaxModeCaption } from '@/shared/utils/priceTaxMode'

function resolveFirstImageUrl(imageIds: string[], images: PublicSiteConfig['images']): string | null {
  const id = imageIds[0]
  if (!id) return null
  const found = [...images.hero, ...images.institutional].find((img) => img.id === id)
  return found?.url || null
}

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
  /**
   * No editor do escritório: links internos (serviços/CTAs) abrem em nova aba
   * para não navegar fora de `/app/firm` e “perder” a sessão da app.
   * Na página pública real permanece navegação na mesma aba.
   */
  openInternalLinksInNewTab?: boolean
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}

function hexStyle(color?: string | null): string | undefined {
  const v = String(color || '').trim()
  return /^#[0-9a-f]{6}$/i.test(v) ? v : undefined
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

export function HeaderSection({
  ctx,
  content,
}: {
  ctx: PublicSiteRenderContext
  content?: PublicSiteChromeContent
}) {
  const bg = hexStyle(content?.backgroundColor)
  const text = hexStyle(content?.textColor)
  const headerLabel = String(content?.title || '').trim() || ctx.firmName
  return (
    <header
      className={bg ? 'border-b border-black/5' : 'border-b border-primary/20 bg-transparent'}
      style={bg ? { backgroundColor: bg } : undefined}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4 lg:max-w-4xl">
        <span
          className={text ? 'font-semibold' : 'font-semibold text-[hsl(var(--brand-text,var(--primary)))]'}
          style={text ? { color: text } : undefined}
        >
          {headerLabel}
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
  const bg = hexStyle(content.backgroundColor)
  const titleColor = hexStyle(content.titleColor)
  const taglineColor = hexStyle(content.taglineColor)
  const bioColor = hexStyle(content.bioColor)
  // Título de destaque ≠ nome do header. Sem fallback para firmName (evita duplicar).
  const heroTitle = String(content.title || '').trim()
  return (
    <section
      className={bg ? 'border-b border-black/5' : 'border-b border-border/40 bg-transparent'}
      style={bg ? { backgroundColor: bg } : undefined}
    >
      {heroPhotoUrl ? (
        <PublicSiteHeroBanner
          src={heroPhotoUrl}
          alt={heroTitle || ctx.firmName}
          fit={content.imageFit}
          position={content.imagePosition}
          backgroundColor={content.backgroundColor}
        />
      ) : null}
      <div className="mx-auto max-w-2xl px-4 py-10 text-center lg:max-w-4xl">
        {ctx.logoUrl ? (
          <img
            src={ctx.logoUrl}
            alt={ctx.firmName}
            className="mx-auto mb-4 h-20 w-20 rounded-full border-2 border-primary/30 object-cover shadow-sm"
          />
        ) : null}
        {heroTitle ? (
          <h1
            className={titleColor ? 'text-2xl font-bold sm:text-3xl' : 'text-2xl font-bold text-[hsl(var(--brand-text,var(--primary)))] sm:text-3xl'}
            style={titleColor ? { color: titleColor } : undefined}
          >
            {heroTitle}
          </h1>
        ) : null}
        {content.tagline ? (
          <p
            className={
              taglineColor
                ? 'mt-2 text-base'
                : 'mt-2 text-base text-[hsl(var(--brand-text,var(--primary)))]'
            }
            style={taglineColor ? { color: taglineColor } : undefined}
          >
            {content.tagline}
          </p>
        ) : null}
        {content.bio ? (
          <p
            className={bioColor ? 'mx-auto mt-3 max-w-xl text-sm' : 'mx-auto mt-3 max-w-xl text-sm text-muted-foreground'}
            style={bioColor ? { color: bioColor } : undefined}
          >
            {content.bio}
          </p>
        ) : null}
        {content.ctas.length > 0 ? (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {content.ctas.map((cta) => {
              const isExternal =
                cta.target.type === 'external-url' || cta.target.type === 'whatsapp'
              const isServiceLink =
                cta.target.type === 'booking' || cta.target.type === 'service-detail'
              const openBlank =
                isExternal || (Boolean(ctx.openInternalLinksInNewTab) && isServiceLink)
              const btnBg = hexStyle(cta.backgroundColor)
              const btnText = hexStyle(cta.textColor)
              const custom = Boolean(btnBg || btnText)
              return (
                <a
                  key={cta.id}
                  href={resolveCtaHref(cta, ctx, socialLinks)}
                  target={openBlank ? '_blank' : undefined}
                  rel={openBlank ? 'noopener noreferrer' : undefined}
                  className={
                    custom
                      ? 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition hover:opacity-90'
                      : cta.style === 'secondary'
                        ? 'inline-flex items-center rounded-lg border-2 border-secondary bg-secondary/15 px-4 py-2 text-sm font-medium text-[hsl(var(--secondary))] transition hover:bg-secondary/25'
                        : 'inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90'
                  }
                  style={
                    custom
                      ? {
                          backgroundColor: btnBg || (cta.style === 'secondary' ? undefined : '#12352a'),
                          color: btnText || '#ffffff',
                          border: cta.style === 'secondary' && !btnBg ? undefined : undefined,
                        }
                      : undefined
                  }
                >
                  {cta.label}
                </a>
              )
            })}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function AboutSection({ content, images }: { content: PublicSiteAboutContent; images: PublicSiteConfig['images'] }) {
  if (!content.heading && !content.body) return null
  const photoUrl = resolveFirstImageUrl(content.imageIds, images)
  const bg = hexStyle(content.backgroundColor)
  const headingColor = hexStyle(content.headingColor)
  const bodyColor = hexStyle(content.bodyColor)
  return (
    <section
      className="px-4 py-6"
      style={bg ? { backgroundColor: bg } : undefined}
    >
      <div className="mx-auto max-w-2xl lg:max-w-4xl space-y-3">
        {photoUrl ? <img src={photoUrl} alt="" loading="lazy" className="w-full rounded-xl object-cover" /> : null}
        {content.heading ? (
          <h2
            className={
              headingColor
                ? 'text-lg font-semibold'
                : 'text-lg font-semibold text-[hsl(var(--brand-text,var(--foreground)))]'
            }
            style={headingColor ? { color: headingColor } : undefined}
          >
            {content.heading}
          </h2>
        ) : null}
        {content.body ? (
          <p
            className={
              bodyColor ? 'whitespace-pre-line text-sm' : 'whitespace-pre-line text-sm text-muted-foreground'
            }
            style={bodyColor ? { color: bodyColor } : undefined}
          >
            {content.body}
          </p>
        ) : null}
      </div>
    </section>
  )
}

function ServiceCard({
  firmSlug,
  service,
  showPrices = true,
  openInNewTab = false,
}: {
  firmSlug: string
  service: PublicFirmServiceSummary
  showPrices?: boolean
  openInNewTab?: boolean
}) {
  const href = `/${encodeURIComponent(firmSlug)}/servicos/${encodeURIComponent(service.slug)}`
  const className =
    'block overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition hover:border-primary/40 hover:shadow-md'
  const body = (
    <>
      {service.imageUrl ? (
        <img src={service.imageUrl} alt="" className="h-36 w-full object-cover" loading="lazy" />
      ) : null}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-[hsl(var(--brand-text,var(--foreground)))]">{service.name}</h3>
            {service.description ? (
              <SanitizedServiceHtml html={service.description} className="mt-1 line-clamp-2 text-sm" />
            ) : null}
          </div>
          {showPrices && service.priceCents > 0 ? (
            <div className="shrink-0 text-right">
              <span className="block text-sm font-semibold text-[hsl(var(--brand-text,var(--primary)))]">
                {formatPrice(service.priceCents)}
              </span>
              {priceTaxModeCaption(service.priceTaxMode) ? (
                <span className="mt-0.5 block max-w-[9rem] text-[10px] font-normal leading-snug text-muted-foreground">
                  {priceTaxModeCaption(service.priceTaxMode)}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        {service.requiresBooking ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" /> {service.durationMinutes} min · com agendamento
          </p>
        ) : null}
      </div>
    </>
  )

  if (openInNewTab) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {body}
      </a>
    )
  }

  return (
    <Link to={href} className={className}>
      {body}
    </Link>
  )
}

export function ServicesSection({ content, ctx }: { content: PublicSiteServicesContent; ctx: PublicSiteRenderContext }) {
  const items = ctx.services.filter((s) => s.requiresBooking)
  if (items.length === 0) return null
  const bg = hexStyle(content.backgroundColor)
  const headingColor = hexStyle(content.headingColor)
  return (
    <section id="servicos" className="px-4 py-6" style={bg ? { backgroundColor: bg } : undefined}>
      <div className="mx-auto max-w-2xl lg:max-w-4xl space-y-3">
        <h2
          className={
            headingColor
              ? 'text-sm font-semibold uppercase tracking-wide'
              : 'text-sm font-semibold uppercase tracking-wide text-[hsl(var(--brand-text,var(--muted-foreground)))]'
          }
          style={headingColor ? { color: headingColor } : undefined}
        >
          {content.heading || 'Serviços com marcação'}
        </h2>
        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.slug}>
              <ServiceCard
                firmSlug={ctx.firmSlug}
                service={s}
                showPrices={ctx.showPrices !== false}
                openInNewTab={Boolean(ctx.openInternalLinksInNewTab)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function BookingServicesSection({ content, ctx }: { content: PublicSiteServicesContent; ctx: PublicSiteRenderContext }) {
  const items = ctx.services.filter((s) => !s.requiresBooking)
  if (items.length === 0) return null
  const bg = hexStyle(content.backgroundColor)
  const headingColor = hexStyle(content.headingColor)
  return (
    <section className="px-4 py-6" style={bg ? { backgroundColor: bg } : undefined}>
      <div className="mx-auto max-w-2xl lg:max-w-4xl space-y-3">
        <h2
          className={
            headingColor
              ? 'text-sm font-semibold uppercase tracking-wide'
              : 'text-sm font-semibold uppercase tracking-wide text-[hsl(var(--brand-text,var(--muted-foreground)))]'
          }
          style={headingColor ? { color: headingColor } : undefined}
        >
          {content.heading || 'Serviços sob pedido'}
        </h2>
        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.slug}>
              <ServiceCard
                firmSlug={ctx.firmSlug}
                service={s}
                showPrices={ctx.showPrices !== false}
                openInNewTab={Boolean(ctx.openInternalLinksInNewTab)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Quando o escritório ainda não publicou serviços — mensagem útil (não silêncio). */
export function EmptyPublicServicesSection() {
  return (
    <section id="servicos" className="px-4 py-10" data-testid="public-services-empty">
      <div className="mx-auto max-w-2xl lg:max-w-4xl rounded-2xl border border-dashed border-border/60 bg-muted/20 px-5 py-8 text-center">
        <h2 className="text-base font-semibold text-foreground">Serviços</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Este escritório ainda não publicou serviços. Volte mais tarde ou use o contacto abaixo, se disponível.
        </p>
      </div>
    </section>
  )
}

export function FeaturesSection({ content }: { content: PublicSiteFeaturesContent }) {
  if (content.items.length === 0) return null
  const bg = hexStyle(content.backgroundColor)
  const titleColor = hexStyle(content.titleColor)
  const textColor = hexStyle(content.textColor)
  return (
    <section className="px-4 py-6" style={bg ? { backgroundColor: bg } : undefined}>
      <div className="mx-auto max-w-2xl lg:max-w-4xl space-y-3">
        <div className="grid gap-4 sm:grid-cols-2">
          {content.items.map((it) => (
            <div key={it.id} className="rounded-xl border border-border/50 bg-card p-4">
              <h3
                className={
                  titleColor
                    ? 'text-sm font-semibold'
                    : 'text-sm font-semibold text-[hsl(var(--brand-text,var(--foreground)))]'
                }
                style={titleColor ? { color: titleColor } : undefined}
              >
                {it.title}
              </h3>
              {it.description ? (
                <p
                  className={textColor ? 'mt-1 text-sm' : 'mt-1 text-sm text-muted-foreground'}
                  style={textColor ? { color: textColor } : undefined}
                >
                  {it.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ProcessSection({ content }: { content: PublicSiteProcessContent }) {
  if (content.steps.length === 0) return null
  const bg = hexStyle(content.backgroundColor)
  const titleColor = hexStyle(content.titleColor)
  const textColor = hexStyle(content.textColor)
  return (
    <section className="px-4 py-6" style={bg ? { backgroundColor: bg } : undefined}>
      <ol className="mx-auto max-w-2xl lg:max-w-4xl space-y-3">
        {content.steps.map((step, index) => (
          <li key={step.id} className="flex gap-3 rounded-xl border border-border/50 bg-card p-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <div>
              <h3
                className={
                  titleColor
                    ? 'text-sm font-semibold'
                    : 'text-sm font-semibold text-[hsl(var(--brand-text,var(--foreground)))]'
                }
                style={titleColor ? { color: titleColor } : undefined}
              >
                {step.title}
              </h3>
              {step.description ? (
                <p
                  className={textColor ? 'mt-1 text-sm' : 'mt-1 text-sm text-muted-foreground'}
                  style={textColor ? { color: textColor } : undefined}
                >
                  {step.description}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function FaqSection({ content }: { content: PublicSiteFaqContent }) {
  if (content.items.length === 0) return null
  const bg = hexStyle(content.backgroundColor)
  const titleColor = hexStyle(content.titleColor)
  const textColor = hexStyle(content.textColor)
  return (
    <section className="px-4 py-6" style={bg ? { backgroundColor: bg } : undefined}>
      <div className="mx-auto max-w-2xl lg:max-w-4xl space-y-3">
        <h2
          className={
            titleColor
              ? 'text-sm font-semibold uppercase tracking-wide'
              : 'text-sm font-semibold uppercase tracking-wide text-[hsl(var(--brand-text,var(--muted-foreground)))]'
          }
          style={titleColor ? { color: titleColor } : undefined}
        >
          Perguntas frequentes
        </h2>
        <div className="space-y-2">
          {content.items.map((faq) => (
            <details key={faq.id} className="group rounded-xl border border-border/50 bg-card p-4">
              <summary
                className={
                  titleColor
                    ? 'cursor-pointer list-none text-sm font-medium marker:content-none'
                    : 'cursor-pointer list-none text-sm font-medium text-[hsl(var(--brand-text,var(--foreground)))] marker:content-none'
                }
                style={titleColor ? { color: titleColor } : undefined}
              >
                {faq.question}
              </summary>
              <p
                className={textColor ? 'mt-2 text-sm' : 'mt-2 text-sm text-muted-foreground'}
                style={textColor ? { color: textColor } : undefined}
              >
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
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
  const bg = hexStyle(content.backgroundColor)
  const text = hexStyle(content.textColor)
  return (
    <section
      id="contactos"
      className="px-4 py-6 text-center text-sm"
      style={{
        backgroundColor: bg,
        color: text || undefined,
      }}
    >
      <div className={`mx-auto max-w-2xl lg:max-w-4xl space-y-2 ${text ? '' : 'text-muted-foreground'}`}>
        {rows.map(({ key, icon: Icon, label, href }) =>
          href ? (
            <a key={key} href={href} className="flex items-center justify-center gap-1.5 hover:opacity-80" style={text ? { color: text } : undefined}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </a>
          ) : (
            <p key={key} className="flex items-center justify-center gap-1.5" style={text ? { color: text } : undefined}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </p>
          ),
        )}
      </div>
    </section>
  )
}

export function FooterSection({
  ctx,
  socialLinks,
  content,
}: {
  ctx: PublicSiteRenderContext
  socialLinks: PublicSiteSocialLinks
  content?: PublicSiteChromeContent
}) {
  const entries = [
    { key: 'instagram', href: socialLinks.instagram, label: 'Instagram', Icon: Instagram },
    { key: 'facebook', href: socialLinks.facebook, label: 'Facebook', Icon: Facebook },
    { key: 'linkedin', href: socialLinks.linkedin, label: 'LinkedIn', Icon: Linkedin },
    { key: 'whatsapp', href: socialLinks.whatsapp, label: 'WhatsApp', Icon: MessageCircle },
    { key: 'website', href: socialLinks.website, label: 'Site', Icon: Globe },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href))
  const bg = hexStyle(content?.backgroundColor)
  const text = hexStyle(content?.textColor)
  return (
    <footer
      className={bg ? 'border-t border-black/5' : 'border-t border-border/40 bg-transparent'}
      style={bg ? { backgroundColor: bg } : undefined}
    >
      {entries.length > 0 ? (
        <div className="mx-auto flex max-w-2xl lg:max-w-4xl flex-wrap items-center justify-center gap-3 px-4 py-8">
          {entries.map(({ key, href, label, Icon }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/50 transition hover:opacity-80"
              style={text ? { color: text, borderColor: text } : undefined}
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      ) : (
        <div className="pt-6" />
      )}
      <div
        className="mx-auto flex max-w-2xl lg:max-w-4xl flex-col items-center gap-2 px-4 pb-6 text-center text-xs"
        style={text ? { color: text } : undefined}
      >
        {ctx.complaintsBookUrl ? (
          <a
            href={ctx.complaintsBookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80"
            style={text ? { color: text } : undefined}
          >
            {ctx.complaintsBookLabel?.trim() || 'Livro de Reclamações'}
          </a>
        ) : null}
        {ctx.praiseUrl ? (
          <a
            href={ctx.praiseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80"
            style={text ? { color: text } : undefined}
          >
            {ctx.praiseLabel?.trim() || 'Deixe a sua avaliação'}
          </a>
        ) : ctx.praiseContact ? (
          <p>{ctx.praiseContact}</p>
        ) : null}
        <p className={text ? 'opacity-80' : 'text-muted-foreground/70'}>{ctx.firmName}</p>
      </div>
    </footer>
  )
}
