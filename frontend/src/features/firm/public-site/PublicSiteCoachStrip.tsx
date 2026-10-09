import { Sparkles } from 'lucide-react'

import { resolvePublicSiteEditorGuide } from '@/features/firm/public-site/publicSiteEditorGuide'
import { PUBLIC_SITE_COACH_LINK_PUBLISH } from '@/features/firm/public-site/publicSiteCoachCopy'
import { cn } from '@/shared/lib/utils'

type Props = {
  zone: 'link-publish' | `section-${string}`
  className?: string
  onAskInChat?: () => void
}

export function PublicSiteCoachStrip({ zone, className, onAskInChat }: Props) {
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
        <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
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
      {onAskInChat ? (
        <button
          type="button"
          className="mt-2 text-[11px] font-medium text-brand underline-offset-2 hover:underline"
          onClick={onAskInChat}
        >
          Perguntar no chat da Maya
        </button>
      ) : null}
    </div>
  )
}
