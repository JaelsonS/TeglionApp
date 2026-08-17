import type { PublicSiteCta, PublicSiteSocialLinks } from '@/shared/types/firmPublicSite'
import type { PublicCtaRenderContext } from '@/features/public-intake/publicSiteCtas'
import { isPublicCtaRenderable, resolvePublicCtaHref } from '@/features/public-intake/publicSiteCtas'

function hexStyle(color?: string | null): string | undefined {
  const v = String(color || '').trim()
  return /^#[0-9a-f]{6}$/i.test(v) ? v : undefined
}

type Props = {
  ctas?: PublicSiteCta[] | null
  ctx: PublicCtaRenderContext
  socialLinks: Partial<PublicSiteSocialLinks>
  className?: string
}

export function PublicSiteCtaButtons({ ctas, ctx, socialLinks, className }: Props) {
  const items = (ctas || []).filter((cta) => isPublicCtaRenderable(cta, ctx, socialLinks))
  if (items.length === 0) return null

  return (
    <div className={className || 'mt-5 flex flex-wrap items-center justify-center gap-2'}>
      {items.map((cta) => {
        const href = resolvePublicCtaHref(cta, ctx, socialLinks)
        const isExternal = cta.target.type === 'external-url' || cta.target.type === 'whatsapp'
        const isServiceLink = cta.target.type === 'booking' || cta.target.type === 'service-detail'
        const openBlank = isExternal || (Boolean(ctx.openInternalLinksInNewTab) && isServiceLink)
        const btnBg = hexStyle(cta.backgroundColor)
        const btnText = hexStyle(cta.textColor)
        const custom = Boolean(btnBg || btnText)
        return (
          <a
            key={cta.id}
            href={href}
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
                  }
                : undefined
            }
          >
            {cta.label}
          </a>
        )
      })}
    </div>
  )
}
