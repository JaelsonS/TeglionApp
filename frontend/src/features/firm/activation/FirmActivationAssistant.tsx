import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, Compass, Loader2, Sparkles } from 'lucide-react'

import { AskMayaButton } from '@/features/maya'
import { openClientsCsvImport } from '@/features/firm/clients/openClientsCsvImport'
import { openMayaSetupInPublicSiteEditor, openMayaSetupWizard } from '@/features/maya/setup/openMayaSetup'
import {
  ACTIVATION_ASSISTANT_OPEN_EVENT,
  MAYA_SETUP_APPLIED_EVENT,
  openActivationAssistant,
} from '@/features/firm/activation/openActivationAssistant'
import {
  ACTIVATION_PHASE_ORDER,
  activationPhaseIndex,
  phaseIsDoneFromProgress,
  resolveActivationPhaseFromProgress,
  type ActivationPhaseId,
} from '@/features/firm/activation/activationAssistant'
import {
  markMayaSetupAppliedForActivation,
  markMayaSetupSkippedForActivation,
  readMayaSetupActivationPrefs,
} from '@/features/firm/activation/activationAssistantPrefs'
import { useFirmProgress } from '@/features/firm/onboarding/useFirmProgress'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { useAuthOptional } from '@/shared/hooks/useAuth'
import type { AuthUser } from '@/shared/types/auth'
import { cn } from '@/shared/lib/utils'

const PHASE_LABELS: Record<ActivationPhaseId, string> = {
  profile: 'Perfil',
  mayaSetup: 'Maya Setup',
  publishPage: 'Publicar página',
  publishServices: 'Serviços públicos',
  firstClient: 'Primeiro cliente',
  complete: 'Concluído',
}

function isFirmOwner(user: AuthUser | null | undefined) {
  if (!user) return false
  if (user.role === 'FIRM_OWNER' || user.role === 'PLATFORM_OWNER') return true
  if (user.firmRole === 'FIRM_OWNER') return true
  return user.permissions?.includes('firm:owner') ?? false
}

export function FirmActivationAssistant() {
  const navigate = useNavigate()
  const auth = useAuthOptional()
  const user = auth?.user ?? null
  const firmSlugKey = user?.tenant?.slug ?? ''
  const owner = isFirmOwner(user)

  const [open, setOpen] = useState(false)
  const [prefsTick, setPrefsTick] = useState(0)
  const { progress, signals, loading, refresh } = useFirmProgress(Boolean(user))

  const prefs = useMemo(
    () => readMayaSetupActivationPrefs(firmSlugKey),
    [firmSlugKey, prefsTick],
  )

  const activationSignals = useMemo(() => {
    if (!user || !signals) return null
    return {
      firmSlug: user.tenant?.slug ?? null,
      isOwner: owner,
      mayaSetupSkipped: prefs.skipped,
      mayaSetupApplied: prefs.applied,
      hasAnyService: signals.hasAnyService,
      serviceCount: signals.serviceCount,
      publicServiceCount: signals.publicServiceCount,
    }
  }, [user, owner, prefs, signals])

  const phase =
    progress && activationSignals
      ? resolveActivationPhaseFromProgress(progress, activationSignals)
      : null

  useEffect(() => {
    function onOpenAssistant() {
      if (!user) return
      setOpen(true)
      refresh()
    }
    function onMayaApplied() {
      if (firmSlugKey) markMayaSetupAppliedForActivation(firmSlugKey)
      setPrefsTick((n) => n + 1)
      refresh()
    }
    window.addEventListener(ACTIVATION_ASSISTANT_OPEN_EVENT, onOpenAssistant)
    window.addEventListener(MAYA_SETUP_APPLIED_EVENT, onMayaApplied)
    return () => {
      window.removeEventListener(ACTIVATION_ASSISTANT_OPEN_EVENT, onOpenAssistant)
      window.removeEventListener(MAYA_SETUP_APPLIED_EVENT, onMayaApplied)
    }
  }, [user, firmSlugKey, refresh])

  useEffect(() => {
    if (!open) return
    refresh()
    const id = window.setInterval(() => refresh(), 4000)
    return () => window.clearInterval(id)
  }, [open, refresh])

  function skipMayaSetup() {
    if (firmSlugKey) markMayaSetupSkippedForActivation(firmSlugKey)
    setPrefsTick((n) => n + 1)
  }

  function openSetupAndKeepAssistant() {
    setOpen(false)
    openMayaSetupInPublicSiteEditor()
  }

  function goToPhase() {
    if (!phase || phase.id === 'complete') return
    setOpen(false)
    if (phase.id === 'mayaSetup') {
      openMayaSetupInPublicSiteEditor()
      return
    }
    navigate(phase.to)
  }

  if (!user || !phase || !progress || !activationSignals) return null

  const currentIdx = activationPhaseIndex(phase.id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" data-testid="firm-activation-assistant">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-brand" aria-hidden />
            Assistente de activação
          </DialogTitle>
          <DialogDescription>
            Guia passo a passo até o escritório estar pronto — sem publicar nada automaticamente.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-1 border-b border-border/60 pb-4" aria-label="Fases de activação">
          {ACTIVATION_PHASE_ORDER.filter((id) => id !== 'complete').map((id) => {
            const done = phaseIsDoneFromProgress(id, progress, activationSignals)
            const current = phase.id === id
            return (
              <li
                key={id}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1 text-sm',
                  current && 'bg-brand/10 font-medium text-foreground',
                  done && !current && 'text-muted-foreground',
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
                ) : (
                  <Circle className={cn('h-4 w-4 shrink-0', current ? 'text-brand' : 'text-muted-foreground')} aria-hidden />
                )}
                <span>{PHASE_LABELS[id]}</span>
                {current ? <span className="text-caption text-brand">Agora</span> : null}
              </li>
            )
          })}
        </ol>

        {loading && !progress ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            A verificar o estado do escritório…
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                Passo {Math.min(currentIdx + 1, 5)} de 5
              </p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">{phase.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{phase.description}</p>
              <p className="mt-2 text-caption text-muted-foreground">
                <span className="font-medium text-foreground">Validação: </span>
                {phase.validationHint}
              </p>
            </div>

            {phase.manualChecklist?.length ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {phase.manualChecklist.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {phase.id === 'complete' ? (
                <Button type="button" className="w-full sm:w-auto" onClick={() => setOpen(false)}>
                  Fechar
                </Button>
              ) : (
                <Button type="button" variant="primary" size="sm" onClick={goToPhase}>
                  {phase.ctaLabel}
                </Button>
              )}
              {phase.mayaIntentId ? <AskMayaButton intentId={phase.mayaIntentId} /> : null}
              {phase.opensClientsCsv && owner ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => { setOpen(false); openClientsCsvImport() }}>
                  Importar CSV
                </Button>
              ) : null}
              {phase.opensMayaSetup && owner ? (
                <>
                  <Button type="button" variant="secondary" size="sm" onClick={openSetupAndKeepAssistant}>
                    <Sparkles className="h-4 w-4" />
                    Abrir Maya Setup
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={skipMayaSetup}>
                    Continuar sem IA
                  </Button>
                </>
              ) : null}
            </div>

            {phase.id !== 'complete' ? (
              <p className="text-caption text-muted-foreground">
                Quando concluir este passo no ecrã indicado, volte aqui ou reabra o assistente no Painel — o passo
                seguinte aparece automaticamente.
              </p>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function OpenActivationAssistantButton({
  className,
  variant = 'secondary',
  size = 'sm',
}: {
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'default'
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => openActivationAssistant()}
      data-testid="open-activation-assistant"
    >
      <Compass className="h-4 w-4" />
      Assistente de activação
    </Button>
  )
}
