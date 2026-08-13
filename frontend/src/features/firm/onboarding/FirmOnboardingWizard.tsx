import {
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  Globe,
  Settings,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/design-system'
import { useAuth } from '@/shared/hooks/useAuth'
import { authApi } from '@/infrastructure/api'
import { cn } from '@/shared/lib/utils'
import type { FirmProgressStepId } from './firmProgress'
import { useFirmProgress } from './useFirmProgress'

const STEP_ICONS: Record<FirmProgressStepId, typeof Settings> = {
  profile: Settings,
  publicPage: Globe,
  service: Sparkles,
  booking: Calendar,
  client: Building2,
  invite: ExternalLink,
}

type FirmOnboardingWizardProps = {
  className?: string
}

export function FirmOnboardingWizard({ className }: FirmOnboardingWizardProps) {
  const { user, refreshUser } = useAuth()
  const enabled = Boolean(user && !user.onboardingCompleted)
  const { loading, progress } = useFirmProgress(enabled)

  if (!user || user.onboardingCompleted || !progress) return null

  const requiredSteps = progress.steps.filter((s) => !s.optional)
  const optionalSteps = progress.steps.filter((s) => s.optional)
  const doneRequired = requiredSteps.filter((s) => s.done).length
  const publicUrl = progress.publicUrl
  const progressPct = progress.progressPct
  const canStartOperating = progress.canStartOperating
  const publicPageDone = Boolean(progress.steps.find((s) => s.id === 'publicPage')?.done)

  async function complete() {
    try {
      await authApi.completeOnboarding()
      await refreshUser()
      toast.success('Onboarding concluído — pode voltar ao guia pelo Painel')
    } catch {
      toast.error('Não foi possível concluir o onboarding')
    }
  }

  async function copyPublicUrl() {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      toast.success('Link da página pública copiado')
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }

  return (
    <section
      className={cn(
        'rounded-xl border border-brand/15 bg-card p-5 shadow-[var(--cb-shadow-card)] sm:p-6',
        className,
      )}
      aria-labelledby="firm-onboarding-title"
      data-testid="firm-onboarding-wizard"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-caption font-semibold uppercase tracking-wide text-brand">Primeiros passos</p>
          <h2 id="firm-onboarding-title" className="mt-1 text-title font-semibold text-foreground">
            Acabou de criar o escritório. O que fazer agora?
          </h2>
          <p className="mt-1 max-w-2xl text-body text-muted-foreground">
            Siga a ordem abaixo: perfil → página pública → serviço publicado → carteira. Os passos
            opcionais (agenda e convite ao portal) aparecem no fim.
          </p>
          <div className="mt-3 max-w-md">
            <div className="mb-1 flex items-center justify-between text-caption text-muted-foreground">
              <span>
                {doneRequired} de {requiredSteps.length} passos essenciais
                {loading ? ' · a actualizar…' : ''}
              </span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} />
          </div>
          {canStartOperating ? (
            <p className="mt-2 text-sm font-medium text-success">
              Já tem perfil e serviço público — pode começar a receber pedidos.
            </p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" className="mt-1 shrink-0 sm:mt-0" onClick={() => void complete()}>
          <CheckCircle2 className="h-4 w-4" />
          Já concluí — ocultar guia
        </Button>
      </div>

      {publicUrl ? (
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-caption font-medium text-muted-foreground">Página pública do escritório</p>
            <p className="text-sm text-muted-foreground">
              É aqui que potenciais clientes conhecem os serviços e entram em contacto.
            </p>
            <p className="mt-1 truncate text-sm font-medium text-foreground">{publicUrl}</p>
            {!publicPageDone ? (
              <p className="mt-1 text-caption text-amber-700 dark:text-amber-400">
                Ainda não está publicada — configure e publique em Definições.
              </p>
            ) : (
              <p className="mt-1 text-caption text-success">Página publicada</p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => void copyPublicUrl()}>
              <Copy className="h-4 w-4" />
              Copiar link
            </Button>
            <Button type="button" size="sm" variant="secondary" asChild>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Ver página
              </a>
            </Button>
            <Button type="button" size="sm" variant="primary" asChild>
              <Link to="/app/firm/settings?tab=pagina-publica">Configurar</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <ul className="mt-5 space-y-2">
        {requiredSteps.map((step) => {
          const Icon = STEP_ICONS[step.id]
          return (
            <li key={step.id}>
              <Link
                to={step.to}
                className={cn(
                  'flex items-start gap-3 rounded-lg border px-3 py-3 transition-colors',
                  step.done
                    ? 'border-success/20 bg-success/5'
                    : 'border-border/60 bg-card hover:border-brand/20 hover:bg-brand/[0.03]',
                )}
              >
                <span className="mt-0.5 shrink-0 text-muted-foreground">
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5 text-success" aria-hidden />
                  ) : (
                    <Circle className="h-5 w-5" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    {step.label}
                    {step.done ? (
                      <span className="text-caption font-medium text-success">Concluído</span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-caption text-muted-foreground">{step.hint}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      {optionalSteps.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-muted-foreground">
            Opcional
          </p>
          <ul className="space-y-2">
            {optionalSteps.map((step) => {
              const Icon = STEP_ICONS[step.id]
              return (
                <li key={step.id}>
                  <Link
                    to={step.to}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border px-3 py-3 transition-colors',
                      step.done
                        ? 'border-success/20 bg-success/5'
                        : 'border-dashed border-border/60 bg-muted/10 hover:border-brand/20',
                    )}
                  >
                    <span className="mt-0.5 shrink-0 text-muted-foreground">
                      {step.done ? (
                        <CheckCircle2 className="h-5 w-5 text-success" aria-hidden />
                      ) : (
                        <Circle className="h-5 w-5" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        {step.label}
                      </span>
                      <span className="mt-0.5 block text-caption text-muted-foreground">{step.hint}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
