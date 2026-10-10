import { cn } from '@/shared/lib/utils'
import { PublicSiteEditorGuideDialog } from './PublicSiteEditorGuideDialog'

export type PublicSiteEditorUIMode = 'simple' | 'advanced'

type Props = {
  mode: PublicSiteEditorUIMode
  onModeChange: (mode: PublicSiteEditorUIMode) => void
  className?: string
}

export function PublicSiteEditorModeBar({ mode, onModeChange, className }: Props) {
  return (
    <div
      className={cn('flex flex-wrap items-center justify-between gap-3', className)}
      data-testid="public-site-editor-mode-bar"
    >
      <div className="inline-flex rounded-lg border border-border/60 bg-muted/30 p-0.5">
        {(
          [
            ['simple', 'Simples'],
            ['advanced', 'Avançado'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              mode === id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-pressed={mode === id}
            onClick={() => onModeChange(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <PublicSiteEditorGuideDialog />
        <p className="text-[11px] text-muted-foreground">
          {mode === 'simple'
            ? 'A → link · B → secções · C → cores e SEO'
            : 'Checklist, legal, extras (C) e secções (B).'}
        </p>
      </div>
    </div>
  )
}
