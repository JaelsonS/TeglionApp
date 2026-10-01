import { Briefcase, FileText, Landmark } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { PublicFirmServiceSummary } from '@/infrastructure/api/contabil/public'
import { SanitizedServiceHtml } from '@/shared/design-system/SanitizedServiceHtml'
import { servicePositionedImageStyle } from '@/shared/utils/servicePositionedImageStyle'
import { formatEuro } from '@/shared/utils/contabilLocale'
import { priceTaxModeCaption } from '@/shared/utils/priceTaxMode'

function hubIcon(name: string): LucideIcon {
  const n = name.toLowerCase()
  if (/irs|particular|declara/.test(n)) return FileText
  if (/empresa|pme|contabil/.test(n)) return Landmark
  return Briefcase
}

function FeaturedHubCard({
  firmSlug,
  service,
  showPrices,
  openInNewTab,
}: {
  firmSlug: string
  service: PublicFirmServiceSummary
  showPrices: boolean
  openInNewTab: boolean
}) {
  const href = `/${encodeURIComponent(firmSlug)}/servicos/${encodeURIComponent(service.slug)}`
  const Icon = hubIcon(service.name)
  const ctaLabel = service.hasOptions ? 'Ver opções →' : 'Saber mais →'

  const inner = (
    <article className="flex h-full flex-col rounded-2xl border border-border/40 bg-card p-5 shadow-sm transition hover:border-[hsl(var(--primary)/0.45)] hover:shadow-md">
      {service.imageUrl ? (
        <div className="mb-4 h-32 w-full overflow-hidden rounded-xl bg-muted/30">
          <img
            src={service.imageUrl}
            alt=""
            className="h-full w-full"
            style={servicePositionedImageStyle(service)}
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--brand-text,var(--primary)))]"
          aria-hidden
        >
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[hsl(var(--brand-text,var(--foreground)))]">{service.name}</h3>
      {service.description ? (
        <SanitizedServiceHtml html={service.description} className="mt-2 line-clamp-3 text-sm text-muted-foreground" />
      ) : null}
      {service.hasOptions && service.options && service.options.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-foreground/85">
          {service.options.slice(0, 4).map((opt) => (
            <li key={opt.slug}>
              <span className="text-muted-foreground">·</span> {opt.name}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
        {showPrices && service.hasOptions && (service.fromPriceCents ?? 0) > 0 ? (
          <p className="text-xs text-muted-foreground">
            A partir de{' '}
            <span className="font-semibold text-[hsl(var(--brand-text,var(--primary)))]">
              {formatEuro(service.fromPriceCents || 0)}
            </span>
          </p>
        ) : showPrices && !service.hasOptions && service.priceCents > 0 ? (
          <p className="text-xs font-semibold text-[hsl(var(--brand-text,var(--primary)))]">
            {formatEuro(service.priceCents)}
            {priceTaxModeCaption(service.priceTaxMode) ? (
              <span className="ml-1 font-normal text-muted-foreground">
                {priceTaxModeCaption(service.priceTaxMode)}
              </span>
            ) : null}
          </p>
        ) : (
          <span />
        )}
        <span className="mt-4 inline-flex h-9 shrink-0 items-center rounded-lg bg-[hsl(var(--primary))] px-4 text-xs font-medium text-primary-foreground">
          {ctaLabel}
        </span>
      </div>
    </article>
  )

  if (openInNewTab) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block h-full">
        {inner}
      </a>
    )
  }
  return (
    <Link to={href} className="block h-full">
      {inner}
    </Link>
  )
}

export function PublicSiteFeaturedServices({
  heading,
  slugs,
  catalog,
  firmSlug,
  showPrices,
  openInNewTab,
}: {
  heading?: string | null
  slugs?: string[] | null
  catalog: PublicFirmServiceSummary[]
  firmSlug: string
  showPrices: boolean
  openInNewTab: boolean
}) {
  const list = (slugs || [])
    .map((slug) => catalog.find((s) => s.slug === slug))
    .filter((s): s is PublicFirmServiceSummary => Boolean(s))
  if (list.length === 0) return null

  const title = String(heading || '').trim()

  return (
    <div className="mb-10" data-testid="public-site-featured-services">
      {title ? (
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--brand-text,var(--muted-foreground)))]">
          {title}
        </h3>
      ) : null}
      <div
        className={`ps-featured-grid grid gap-5 ${
          list.length >= 3 ? 'ps-featured-grid--triple' : 'ps-featured-grid--pair'
        }`}
      >
        {list.map((service) => (
          <FeaturedHubCard
            key={service.slug}
            firmSlug={firmSlug}
            service={service}
            showPrices={showPrices}
            openInNewTab={openInNewTab}
          />
        ))}
      </div>
    </div>
  )
}
