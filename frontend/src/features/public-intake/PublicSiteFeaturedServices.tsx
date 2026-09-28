import { Link } from 'react-router-dom'

import type { PublicFirmServiceSummary } from '@/infrastructure/api/contabil/public'
import { SanitizedServiceHtml } from '@/shared/design-system/SanitizedServiceHtml'
import { servicePositionedImageStyle } from '@/shared/utils/servicePositionedImageStyle'
import { formatEuro } from '@/shared/utils/contabilLocale'
import { priceTaxModeCaption } from '@/shared/utils/priceTaxMode'

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
  const inner = (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition hover:border-primary/35 hover:shadow-md">
      {service.imageUrl ? (
        <div className="h-40 w-full overflow-hidden bg-muted/30">
          <img
            src={service.imageUrl}
            alt=""
            className="h-full w-full"
            style={servicePositionedImageStyle(service)}
            loading="lazy"
          />
        </div>
      ) : (
        <div className="h-2 w-full bg-[hsl(var(--primary)/0.35)]" aria-hidden />
      )}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold text-[hsl(var(--brand-text,var(--foreground)))]">{service.name}</h3>
        {service.description ? (
          <SanitizedServiceHtml html={service.description} className="mt-2 line-clamp-3 text-sm text-muted-foreground" />
        ) : null}
        {service.hasOptions && service.options && service.options.length > 0 ? (
          <ul className="mt-4 space-y-1.5 border-t border-border/40 pt-3">
            {service.options.slice(0, 5).map((opt) => (
              <li key={opt.slug} className="text-sm text-foreground/85">
                <span className="text-muted-foreground">·</span> {opt.name}
              </li>
            ))}
            {service.options.length > 5 ? (
              <li className="text-xs text-muted-foreground">+ {service.options.length - 5} modalidades</li>
            ) : null}
          </ul>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          {showPrices && service.hasOptions && (service.fromPriceCents ?? 0) > 0 ? (
            <p className="text-sm">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">A partir de </span>
              <span className="font-semibold text-[hsl(var(--brand-text,var(--primary)))]">
                {formatEuro(service.fromPriceCents || 0)}
              </span>
            </p>
          ) : showPrices && !service.hasOptions && service.priceCents > 0 ? (
            <p className="text-sm font-semibold text-[hsl(var(--brand-text,var(--primary)))]">
              {formatEuro(service.priceCents)}
              {priceTaxModeCaption(service.priceTaxMode) ? (
                <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                  {priceTaxModeCaption(service.priceTaxMode)}
                </span>
              ) : null}
            </p>
          ) : (
            <span />
          )}
          <span className="shrink-0 text-sm font-medium text-[hsl(var(--brand-text,var(--primary)))]">
            {service.hasOptions ? 'Ver opções →' : 'Saber mais →'}
          </span>
        </div>
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

  const title = String(heading || '').trim() || 'Destaques'

  return (
    <div className="mb-10" data-testid="public-site-featured-services">
      <h3 className="mb-4 text-base font-semibold uppercase tracking-wide text-[hsl(var(--brand-text,var(--muted-foreground)))]">
        {title}
      </h3>
      <div
        className={
          list.length >= 3
            ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
            : 'grid gap-4 sm:grid-cols-2'
        }
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
