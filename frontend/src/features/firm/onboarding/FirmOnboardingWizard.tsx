import { useQuery } from '@tanstack/react-query'
import { Building2, CheckCircle2, Circle, ClipboardList, Settings, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'
import { useFirmDashboard } from '@/shared/hooks/queries/useFirmDashboard'
import { useAuth } from '@/shared/hooks/useAuth'
import { authApi, contabilFirmApi } from '@/infrastructure/api'
import { cn } from '@/shared/lib/utils'

const STEPS = [
  {
    id: 'settings',
    label: 'Configure o perfil do escritório',
    hint: 'Nome, logo e dados de contacto',
    to: '/app/firm/settings',
    icon: Settings,
  },
  {
    id: 'client',
    label: 'Adicione a primeira empresa',
    hint: 'Registe um cliente no portefólio',
    to: '/app/firm/clients',
    icon: Building2,
  },
  {
    id: 'invite',
    label: 'Convide um cliente ao portal',
    hint: 'Partilhe o link de registo',
    to: '/app/firm/clients',
    icon: UserPlus,
  },
  {
    id: 'obligation',
    label: 'Crie uma obrigação ou tarefa',
    hint: 'Organize prazos fiscais',
    to: '/app/firm/tasks/obligations?create=1',
    icon: ClipboardList,
  },
] as const

type StepId = (typeof STEPS)[number]['id']

type FirmOnboardingWizardProps = {
  className?: string
}

export function FirmOnboardingWizard({ className }: FirmOnboardingWizardProps) {
  const { user, refreshUser } = useAuth()
  const dashboard = useFirmDashboard(Boolean(user && !user.onboardingCompleted))

  const { data: firmData } = useQuery({
    queryKey: ['onboarding', 'firm-branding'],
    queryFn: () => contabilFirmApi.getFirm(),
    enabled: Boolean(user && !user.onboardingCompleted),
    staleTime: 60_000,
  })

  if (!user || user.onboardingCompleted) return null

  const dash = dashboard.data
  const hasLogo = Boolean(firmData?.firm?.branding?.logoUrl || firmData?.logoUrl)
  const hasClient = (dash?.totalClients ?? 0) > 0
  const hasWorkItem =
    (dash?.obligations?.total ?? 0) > 0 || (dash?.tasksOpen ?? 0) > 0

  const completed: Record<StepId, boolean> = {
    settings: hasLogo,
    client: hasClient,
    invite: false,
    obligation: hasWorkItem,
  }

  const doneCount = Object.values(completed).filter(Boolean).length
  const progressPct = Math.round((doneCount / STEPS.length) * 100)

  async function complete() {
    try {
      await authApi.completeOnboarding()
      await refreshUser()
    } catch {
      /* toast handled by api layer if needed */
    }
  }

  return (
    <section
      className={cn(
        'rounded-2xl border border-brand/15 bg-gradient-to-br from-white to-[#E3F0FF]/40 p-5 shadow-sm sm:p-6',
        className,
      )}
      aria-labelledby="firm-onboarding-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">Primeiros passos</p>
          <h2 id="firm-onboarding-title" className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
            Configure o escritório em poucos minutos
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Complete estes passos para tirar partido do Teglion — documentos, prazos e portal do cliente.
          </p>
          <div className="mt-3 max-w-md">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{doneCount} de {STEPS.length} concluídos</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="mt-1 shrink-0 sm:mt-0" onClick={() => void complete()}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Marcar como concluído
        </Button>
      </div>

      <ol className="mt-5 grid gap-3 sm:grid-cols-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const isDone = completed[step.id]
          return (
            <li key={step.id}>
              <Link
                to={step.to}
                className={cn(
                  'flex h-full items-start gap-3 rounded-xl border p-4 transition-colors',
                  isDone
                    ? 'border-brand/25 bg-brand/[0.04] hover:bg-brand/[0.07]'
                    : 'border-border/70 bg-card hover:border-brand/30 hover:bg-muted/30',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold',
                    isDone ? 'bg-brand text-primary-foreground' : 'bg-brand/10 text-brand',
                  )}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                    <span className="truncate">{step.label}</span>
                    {isDone ? (
                      <span className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wide text-brand">
                        Feito
                      </span>
                    ) : (
                      <Circle className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/50" aria-hidden />
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{step.hint}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
