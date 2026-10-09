import { resolvePublicSiteEditorGuide } from '@/features/firm/public-site/publicSiteEditorGuide'
import { PUBLIC_SITE_COACH_LINK_PUBLISH } from '@/features/firm/public-site/publicSiteCoachCopy'
import { openMayaForPublicSiteCoach } from '@/features/firm/public-site/publicSiteCoachContext'
import { MayaAvatar } from '@/features/maya/MayaAvatar'
import { cn } from '@/shared/lib/utils'

type Props = {
  zone: 'link-publish' | `section-${string}`
  className?: string
}

export function PublicSiteCoachStrip({ zone, className }: Props) {
  const isLink = zone === 'link-publish'
  const guide = isLink
    ? { intentId: PUBLIC_SITE_COACH_LINK_PUBLISH.intentId, mayaTip: PUBLIC_SITE_COACH_LINK_PUBLISH.bullets[0] }
    : resolvePublicSiteEditorGuide(zone.replace(/^section-/, ''))

  return (
    <div
      className={cn(
        'rounded-lg border border-brand/20 bg-brand/[0.04] px-3 py-2.5',
        className,
      )}
      data-coach-zone={zone}
      data-testid="public-site-coach-strip"
    >
      <p className="flex items-center gap-2 text-xs font-semibold text-brand">
        <MayaAvatar size="xs" ring={false} />
        Maya — o que fazer aqui
      </p>
      {isLink ? (
        <ul className="mt-2 list-inside list-disc space-y-1 text-[12px] leading-relaxed text-muted-foreground">
          {PUBLIC_SITE_COACH_LINK_PUBLISH.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{guide.mayaTip}</p>
      )}
      <button
        type="button"
        className="mt-2 text-[11px] font-medium text-brand underline-offset-2 hover:underline"
        onClick={() => openMayaForPublicSiteCoach(guide.intentId)}
      >
        Falar com a Maya sobre isto
      </button>
    </div>
  )
}
