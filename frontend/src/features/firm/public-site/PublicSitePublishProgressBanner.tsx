import type { PublicSitePublishReadinessItem } from '@/features/firm/public-site/publicSitePublishReadiness'
import { openMayaForPublicSiteCoach } from '@/features/firm/public-site/publicSiteCoachContext'
import { MayaAvatar } from '@/features/maya/MayaAvatar'
import { cn } from '@/shared/lib/utils'

type Props = {
  items: PublicSitePublishReadinessItem[]
  onFocus: (item: PublicSitePublishReadinessItem) => void
  mayaTip?: string
  mayaIntentId?: string
  className?: string
}

/** Modo simples — um banner em vez da checklist completa. */
export function PublicSitePublishProgressBanner({
  items,
  onFocus,
  mayaTip,
  mayaIntentId = 'public-page',
  className,
}: Props) {
  const done = items.filter((i) => i.ok).length
  const total = items.length
  const next = items.find((i) => !i.ok)

  return (
    <section
      className={cn(
        'rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm',
        className,
      )}
      aria-label="Progresso até publicar"
      data-testid="public-site-publish-progress-banner"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {done} de {total} passos até publicar
        </p>
        <div className="h-1.5 min-w-[8rem] flex-1 max-w-xs overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${total ? Math.round((done / total) * 100) : 0}%` }}
          />
        </div>
      </div>
      {next ? (
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          Próximo:{' '}
          <button
            type="button"
            className="font-medium text-foreground underline-offset-2 hover:underline"
            onClick={() => onFocus(next)}
          >
            {next.label}
          </button>
          {' — '}
          {next.detail}
        </p>
      ) : (
        <p className="mt-2 text-[12px] text-muted-foreground">
          Requisitos base cumpridos — confirme textos legais antes de publicar.
        </p>
      )}
      {mayaTip ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
          <MayaAvatar size="xs" ring={false} />
          <p className="min-w-0 flex-1 text-[11px] leading-snug text-muted-foreground">{mayaTip}</p>
          <button
            type="button"
            className="text-[11px] font-medium text-brand underline-offset-2 hover:underline"
            onClick={() => openMayaForPublicSiteCoach(mayaIntentId)}
          >
            Abrir Maya
          </button>
        </div>
      ) : null}
    </section>
  )
}
