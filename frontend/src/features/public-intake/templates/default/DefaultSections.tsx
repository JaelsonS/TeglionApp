import { Link } from 'react-router-dom'
import {
  CalendarClock,
  ChevronDown,
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
  PublicSiteNavLink,
  PublicSiteProcessContent,
  PublicSiteServicesContent,
  PublicSiteSocialLinks,
} from '@/shared/types/firmPublicSite'
import type { PublicFirmServiceSummary } from '@/infrastructure/api/contabil/public'
import { clusterPublicServices, uniquePublicServiceGroups } from '@/features/public-intake/clusterPublicServices'
import { defaultPublicSiteNavLinks } from '@/features/public-intake/publicSiteNavLinks'
import { PublicSiteHeroBanner } from '@/features/public-intake/PublicSiteHeroBanner'
import { PublicSiteCtaButtons } from '@/features/public-intake/PublicSiteCtaButtons'
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
  /** Crédito «Página criada com Teglion». Default true. */
  showTeglionCredit?: boolean
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}

function hexStyle(color?: string | null): string | undefined {
  const v = String(color || '').trim()
  return /^#[0-9a-f]{6}$/i.test(v) ? v : undefined
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
  const labelStyle = text ? { color: text } : undefined
  const labelClass = text
    ? 'font-semibold tracking-wide'
    : 'font-semibold tracking-wide text-[hsl(var(--brand-text,var(--primary)))]'
  const navClass = text
    ? 'text-sm font-medium opacity-90 hover:opacity-100'
    : 'text-sm font-medium text-[hsl(var(--brand-text,var(--muted-foreground)))] hover:text-[hsl(var(--brand-text,var(--foreground)))]'
  const groups = uniquePublicServiceGroups(ctx.services)
  const homeHref = `/${encodeURIComponent(ctx.firmSlug)}`
  const showNav = content?.showNav !== false
  const navLinks = defaultPublicSiteNavLinks(content).filter((link) => link.enabled)
  const publicSlugs = new Set(ctx.services.map((s) => s.slug).filter(Boolean))
  const visibleLinks = navLinks.filter((link) => {
    if (link.kind === 'areas') return groups.length > 0
    if (link.kind === 'external') return Boolean(link.url)
    if (link.kind === 'service') return Boolean(link.serviceId && publicSlugs.has(link.serviceId))
    return Boolean(link.label)
  })

  return (
    <header
      className={bg ? 'border-b border-black/5' : 'border-b border-primary/20 bg-transparent'}
      style={bg ? { backgroundColor: bg } : undefined}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 lg:max-w-4xl">
        {ctx.logoUrl ? (
          <Link to={homeHref} className="shrink-0" aria-label={headerLabel}>
            <img src={ctx.logoUrl} alt="" className="h-9 w-9 rounded-md object-contain" />
          </Link>
        ) : null}
        <Link to={homeHref} className={labelClass} style={labelStyle}>
          {headerLabel}
        </Link>
        {showNav && visibleLinks.length > 0 ? (
          <nav
            className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto text-sm"
            aria-label="Navegação do site"
          >
            {visibleLinks.map((link) => (
              <HeaderNavItem
                key={link.id}
                link={link}
                ctx={ctx}
                groups={groups}
                navClass={navClass}
                labelStyle={labelStyle}
              />
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  )
}

function HeaderNavItem({
  link,
  ctx,
  groups,
  navClass,
  labelStyle,
}: {
  link: PublicSiteNavLink
  ctx: PublicSiteRenderContext
  groups: ReturnType<typeof uniquePublicServiceGroups>
  navClass: string
  labelStyle?: { color: string }
}) {
  if (link.kind === 'areas') {
    return (
      <details className="group relative shrink-0">
        <summary
          className={`flex cursor-pointer list-none items-center gap-1 rounded-lg px-2.5 py-1.5 marker:content-none ${navClass}`}
          style={labelStyle}
        >
          {link.label}
          <ChevronDown className="h-3.5 w-3.5 opacity-70 transition group-open:rotate-180" aria-hidden />
        </summary>
        <div className="absolute right-0 z-30 mt-1 max-h-[70vh] w-64 overflow-y-auto rounded-xl border border-border/70 bg-card p-2 shadow-lg">
          {groups.map((group) => (
            <details key={group.heading || 'outros'} className="rounded-lg">
              <summary className="cursor-pointer list-none rounded-md px-2 py-1.5 text-sm font-semibold text-foreground marker:content-none hover:bg-muted/60">
                {group.heading}
              </summary>
              <ul className="pb-1 pl-1">
                {group.items.slice(0, 12).map((service) => (
                  <li key={service.slug}>
                    <Link
                      to={`/${encodeURIComponent(ctx.firmSlug)}/servicos/${encodeURIComponent(service.slug)}`}
                      className="block rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </details>
    )
  }

  if (link.kind === 'external' && link.url) {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`shrink-0 rounded-lg px-2.5 py-1.5 ${navClass}`}
        style={labelStyle}
      >
        {link.label}
      </a>
    )
  }

  if (link.kind === 'service' && link.serviceId) {
    const href = `/${encodeURIComponent(ctx.firmSlug)}/servicos/${encodeURIComponent(link.serviceId)}`
    return (
      <Link
        to={href}
        target={ctx.openInternalLinksInNewTab ? '_blank' : undefined}
        rel={ctx.openInternalLinksInNewTab ? 'noopener noreferrer' : undefined}
        className={`shrink-0 rounded-lg px-2.5 py-1.5 ${navClass}`}
        style={labelStyle}
      >
        {link.label}
      </Link>
    )
  }

  const sectionId = link.sectionId || 'servicos'
  return (
    <a href={`#${sectionId}`} className={`shrink-0 rounded-lg px-2.5 py-1.5 ${navClass}`} style={labelStyle}>
      {link.label}
    </a>
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
        <PublicSiteCtaButtons ctas={content.ctas} ctx={ctx} socialLinks={socialLinks} />
      </div>
    </section>
  )
}

export function AboutSection({
  content,
  images,
  ctx,
  socialLinks,
}: {
  content: PublicSiteAboutContent
  images: PublicSiteConfig['images']
  ctx: PublicSiteRenderContext
  socialLinks: PublicSiteSocialLinks
}) {
  const hasCtas = (content.ctas?.length ?? 0) > 0
  if (!content.heading && !content.body && !hasCtas && content.imageIds.length === 0) return null
  const photoUrl = resolveFirstImageUrl(content.imageIds, images)
  const bg = hexStyle(content.backgroundColor)
  const headingColor = hexStyle(content.headingColor)
  const bodyColor = hexStyle(content.bodyColor)
  return (
    <section
      id="sobre"
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
        <PublicSiteCtaButtons
          ctas={content.ctas}
          ctx={ctx}
          socialLinks={socialLinks}
          className="flex flex-wrap gap-2"
        />
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

export function ServicesSection({
  content,
  ctx,
  socialLinks,
}: {
  content: PublicSiteServicesContent
  ctx: PublicSiteRenderContext
  socialLinks: PublicSiteSocialLinks
}) {
  const items = ctx.services.filter((s) => s.requiresBooking)
  const hasCtas = (content.ctas?.length ?? 0) > 0
  if (items.length === 0 && !hasCtas) return null
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
        {clusterPublicServices(items).map((cluster) => (
          <div key={cluster.heading || '__ungrouped'} className="space-y-2">
            {cluster.heading ? (
              <h3 className="text-sm font-semibold text-[hsl(var(--brand-text,var(--foreground)))]">
                {cluster.heading}
              </h3>
            ) : null}
            <ul className="space-y-3">
              {cluster.items.map((s) => (
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
        ))}
        <PublicSiteCtaButtons
          ctas={content.ctas}
          ctx={ctx}
          socialLinks={socialLinks}
          className="flex flex-wrap gap-2"
        />
      </div>
    </section>
  )
}

export function BookingServicesSection({
  content,
  ctx,
  socialLinks,
}: {
  content: PublicSiteServicesContent
  ctx: PublicSiteRenderContext
  socialLinks: PublicSiteSocialLinks
}) {
  const items = ctx.services.filter((s) => !s.requiresBooking)
  const hasCtas = (content.ctas?.length ?? 0) > 0
  if (items.length === 0 && !hasCtas) return null
  const bg = hexStyle(content.backgroundColor)
  const headingColor = hexStyle(content.headingColor)
  return (
    <section id="outros-servicos" className="px-4 py-6" style={bg ? { backgroundColor: bg } : undefined}>
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
        {clusterPublicServices(items).map((cluster) => (
          <div key={cluster.heading || '__ungrouped'} className="space-y-2">
            {cluster.heading ? (
              <h3 className="text-sm font-semibold text-[hsl(var(--brand-text,var(--foreground)))]">
                {cluster.heading}
              </h3>
            ) : null}
            <ul className="space-y-3">
              {cluster.items.map((s) => (
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
        ))}
        <PublicSiteCtaButtons
          ctas={content.ctas}
          ctx={ctx}
          socialLinks={socialLinks}
          className="flex flex-wrap gap-2"
        />
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
    <section id="destaques" className="px-4 py-6" style={bg ? { backgroundColor: bg } : undefined}>
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
    <section id="como-trabalhamos" className="px-4 py-6" style={bg ? { backgroundColor: bg } : undefined}>
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
    <section id="faq" className="px-4 py-6" style={bg ? { backgroundColor: bg } : undefined}>
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

export function ContactSection({
  content,
  ctx,
  socialLinks,
}: {
  content: PublicSiteContactContent
  ctx: PublicSiteRenderContext
  socialLinks: PublicSiteSocialLinks
}) {
  const rows = [
    content.showEmail && ctx.contact.email ? { key: 'email', icon: Mail, label: ctx.contact.email, href: `mailto:${ctx.contact.email}` } : null,
    content.showPhone && ctx.contact.phone
      ? { key: 'phone', icon: Phone, label: ctx.contact.phone, href: `tel:${ctx.contact.phone.replace(/[^\d+]/g, '')}` }
      : null,
    content.showAddress && ctx.contact.address ? { key: 'address', icon: MapPin, label: ctx.contact.address, href: null } : null,
  ].filter((r): r is NonNullable<typeof r> => Boolean(r))
  const hasCtas = (content.ctas?.length ?? 0) > 0
  if (rows.length === 0 && !hasCtas) return null
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
        <PublicSiteCtaButtons
          ctas={content.ctas}
          ctx={ctx}
          socialLinks={socialLinks}
          className="flex flex-wrap items-center justify-center gap-2 pt-2"
        />
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
