import { AlertTriangle, Check, Circle } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import type { PublicSiteLegalGap } from './publicSiteLegalCompliance'
import type { PublicSitePublishReadinessItem } from './publicSitePublishReadiness'

type Props = {
  items: PublicSitePublishReadinessItem[]
  legalGaps?: PublicSiteLegalGap[]
  onFocus: (item: PublicSitePublishReadinessItem) => void
  onFocusLegal?: () => void
}

export function PublicSitePublishReadinessChecklist({
  items,
  legalGaps = [],
  onFocus,
  onFocusLegal,
}: Props) {
  const readyCount = items.filter((i) => i.ok).length
  const allReady = readyCount === items.length
  const legalPending = legalGaps.length > 0

  return (
    <div className="space-y-2 rounded-lg border border-border/50 bg-card/80 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Pronto para publicar?</p>
        <p className="text-[11px] text-muted-foreground">
          {allReady ? 'Requisitos mínimos cumpridos' : `${readyCount}/${items.length} itens mínimos`}
          {legalPending
            ? ' · Livro de Reclamações e políticas do escritório por rever'
            : ' · Documentos legais indicados'}
        </p>
      </div>
      {legalPending ? (
        <p className="flex items-start gap-1.5 rounded-md border border-amber-500/35 bg-amber-500/10 px-2.5 py-2 text-[11px] leading-snug text-amber-950 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            Em Portugal, o site do escritório deve permitir aceder ao{' '}
            <span className="font-medium">Livro de Reclamações</span> e ter{' '}
            <span className="font-medium">Termos</span> e <span className="font-medium">Privacidade</span> adaptados ao
            seu negócio. A Teglion não presta aconselhamento jurídico — a responsabilidade legal é do escritório.
          </span>
        </p>
      ) : null}
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onFocus(item)}
              className={cn(
                'inline-flex max-w-full items-start gap-1.5 rounded-full border px-2.5 py-1 text-left text-[11px] transition',
                item.ok
                  ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:border-brand/40 hover:bg-brand/5 hover:text-foreground',
              )}
              title={item.detail}
            >
              {item.ok ? (
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              ) : (
                <Circle className="mt-0.5 h-3 w-3 shrink-0 opacity-50" aria-hidden />
              )}
              <span>
                <span className="font-medium">{item.label}</span>
                {!item.ok ? <span className="mt-0.5 block font-normal opacity-90">{item.detail}</span> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {legalPending ? (
        <ul className="flex flex-wrap gap-2 border-t border-border/40 pt-2">
          {legalGaps.map((gap) => (
            <li key={gap.id}>
              <button
                type="button"
                onClick={() => onFocusLegal?.()}
                className="inline-flex max-w-full items-start gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-left text-[11px] text-amber-950 transition hover:bg-amber-500/15 dark:text-amber-100"
                title={gap.detail}
              >
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                <span>
                  <span className="font-medium">{gap.label}</span>
                  <span className="mt-0.5 block font-normal opacity-90">{gap.detail}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
