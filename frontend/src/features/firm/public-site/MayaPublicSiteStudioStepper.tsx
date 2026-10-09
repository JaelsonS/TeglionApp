import { cn } from '@/shared/lib/utils'

export type StudioPhase = 'tell' | 'review' | 'publish'

const PHASES: Array<{ id: StudioPhase; label: string; hint: string }> = [
  { id: 'tell', label: '1 · Contar', hint: 'Questionário, marca e imagens' },
  { id: 'review', label: '2 · Rever', hint: 'Editar proposta IA + preview' },
  { id: 'publish', label: '3 · Publicar', hint: 'Guardar, pré-visualizar, publicar' },
]

export function mapSetupStepToPhase(step: string): StudioPhase {
  if (step === 'loading' || step === 'preview') return 'review'
  if (step === 'done') return 'publish'
  return 'tell'
}

type Props = {
  currentStep: string
}

export function MayaPublicSiteStudioStepper({ currentStep }: Props) {
  const phase = mapSetupStepToPhase(currentStep)
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Passos do estúdio da página pública">
      {PHASES.map((p) => {
        const active = p.id === phase
        const done =
          (p.id === 'tell' && (phase === 'review' || phase === 'publish')) ||
          (p.id === 'review' && phase === 'publish')
        return (
          <div
            key={p.id}
            className={cn(
              'rounded-lg border px-3 py-2 text-left',
              active && 'border-brand/40 bg-brand/[0.06]',
              done && !active && 'border-border/40 bg-muted/20 opacity-90',
              !active && !done && 'border-border/30 bg-card',
            )}
          >
            <p className={cn('text-sm font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>
              {p.label}
            </p>
            <p className="text-[11px] text-muted-foreground">{p.hint}</p>
          </div>
        )
      })}
    </nav>
  )
}
