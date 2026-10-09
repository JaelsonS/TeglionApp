import { CheckCircle2, Circle, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Progress } from '@/shared/design-system'
import type { FirmProgressResult } from '@/features/firm/onboarding/firmProgress'
import { listPendingActivationSteps } from '@/features/firm/onboarding/firmProgress'
import { OpenActivationAssistantButton } from '@/features/firm/activation/FirmActivationAssistant'
import { openMayaSetupWizard } from '@/features/maya/setup/openMayaSetup'

type FirmActivationChecklistProps = {
  progress: FirmProgressResult | null
  loading?: boolean
  isOwner?: boolean
}

export function FirmActivationChecklist({ progress, loading, isOwner }: FirmActivationChecklistProps) {
  if (!progress) return null

  const pending = listPendingActivationSteps(progress.steps)
  const compact = progress.canStartOperating

  return (
    <Card
      className="shadow-[var(--cb-shadow-card)]"
      data-testid="firm-activation-checklist"
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
              Activacao do escritório
            </p>
            <CardTitle className="text-base">
              {compact ? 'Pronto a operar no Teglion' : 'O que falta para captar clientes online'}
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              {compact
                ? 'Perfil, página publicada e serviço visível — pode focar-se na carteira e nos pedidos.'
                : 'Passos essenciais (não inclui convites ao portal nem agenda, que são opcionais).'}
            </CardDescription>
          </div>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {loading ? '…' : `${progress.activationRequiredDone}/${progress.activationRequiredTotal}`}
          </p>
        </div>
        <Progress value={progress.progressPct} className="mt-3" />
      </CardHeader>
      <CardContent className="space-y-3">
        {!compact ? (
          <ul className="space-y-2">
            {pending.slice(0, 4).map((step) => (
              <li key={step.id}>
                <Link
                  to={step.to}
                  className="flex items-start gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors hover:border-brand/25 hover:bg-brand/[0.03]"
                >
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span>
                    <span className="font-medium text-foreground">{step.label}</span>
                    <span className="mt-0.5 block text-caption text-muted-foreground">{step.hint}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            Checklist essencial concluída ({progress.progressPct}%)
          </p>
        )}
        {isOwner && !compact ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <OpenActivationAssistantButton className="w-full sm:w-auto" />
            <Button type="button" size="sm" variant="secondary" className="w-full sm:w-auto" onClick={() => openMayaSetupWizard()}>
              <Sparkles className="h-4 w-4" />
              Maya configura por mim (rascunho)
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
