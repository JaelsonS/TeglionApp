import { Check, Circle } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import type { PublicSitePublishReadinessItem } from './publicSitePublishReadiness'

type Props = {
  items: PublicSitePublishReadinessItem[]
  onFocus: (item: PublicSitePublishReadinessItem) => void
}

export function PublicSitePublishReadinessChecklist({ items, onFocus }: Props) {
  const readyCount = items.filter((i) => i.ok).length
  const allReady = readyCount === items.length

  return (
    <div className="space-y-2 rounded-lg border border-border/50 bg-card/80 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Pronto para publicar?</p>
        <p className="text-[11px] text-muted-foreground">
          {allReady ? 'Requisitos mínimos cumpridos' : `${readyCount}/${items.length} itens`}
          {' · '}
          Termos legais opcionais
        </p>
      </div>
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
    </div>
  )
}
