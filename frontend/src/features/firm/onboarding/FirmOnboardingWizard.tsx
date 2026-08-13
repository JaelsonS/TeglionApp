import { useQuery } from '@tanstack/react-query'
import { Building2, CheckCircle2, Circle, ClipboardList, Copy, ExternalLink, Globe, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { useFirmDashboard } from '@/shared/hooks/queries/useFirmDashboard'
import { useAuth } from '@/shared/hooks/useAuth'
import { authApi, contabilClientsApi, contabilFirmApi } from '@/infrastructure/api'
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
    id: 'public',
    label: 'Configure a página pública',
    hint: 'O link que os clientes usam para o encontrar',
    to: '/app/firm/settings?tab=pagina-publica',
    icon: Globe,
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
    hint: 'Partilhe o link de registo do portal',
    to: '/app/firm/clients',
    icon: ExternalLink,
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
  const firmSlug = user?.tenant?.slug || null

  const { data: firmData } = useQuery({
    queryKey: ['onboarding', 'firm-branding'],
    queryFn: () => contabilFirmApi.getFirm(),
    enabled: Boolean(user && !user.onboardingCompleted),
    staleTime: 60_000,
  })

  const { data: clientsData } = useQuery({
    queryKey: ['onboarding', 'clients-portal'],
    queryFn: () => contabilClientsApi.list({ limit: 50 }),
    enabled: Boolean(user && !user.onboardingCompleted),
    staleTime: 60_000,
  })

  if (!user || user.onboardingCompleted) return null

  const dash = dashboard.data
  const hasLogo = Boolean(firmData?.firm?.branding?.logoUrl || firmData?.logoUrl)
  const hasClient = (dash?.totalClients ?? 0) > 0
  const hasWorkItem = (dash?.obligations?.total ?? 0) > 0 || (dash?.tasksOpen ?? 0) > 0
  const hasPublicSlug = Boolean(firmSlug && firmSlug !== 'escritorio')
  const hasPortalInvite = (clientsData?.items ?? []).some((c) => {
    const status = String((c as { portalAccessStatus?: string }).portalAccessStatus || '')
    return status === 'PENDING_INVITE' || status === 'ACTIVE'
  })

  const publicUrl =
    typeof window !== 'undefined' && firmSlug
      ? `${window.location.origin}/${encodeURIComponent(firmSlug)}`
      : firmSlug
        ? `https://teglion.com/${encodeURIComponent(firmSlug)}`
        : null

  const completed: Record<StepId, boolean> = {
    settings: hasLogo,
    public: hasPublicSlug,
    client: hasClient,
    invite: hasPortalInvite,
    obligation: hasWorkItem,
  }

  const doneCount = Object.values(completed).filter(Boolean).length
  const progressPct = Math.round((doneCount / STEPS.length) * 100)
  const canStartOperating = hasLogo && hasClient

  async function complete() {
    try {
      await authApi.completeOnboarding()
      await refreshUser()
    } catch {
      /* toast handled by api layer if needed */
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
        'rounded-xl border border-brand/15 bg-gradient-to-br from-card to-[hsl(var(--cb-brand-soft))] p-5 shadow-[var(--cb-shadow-card)] sm:p-6',
        className,
      )}
      aria-labelledby="firm-onboarding-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-caption font-semibold uppercase tracking-wide text-brand">Primeiros passos</p>
          <h2 id="firm-onboarding-title" className="mt-1 text-title font-semibold text-foreground">
            Configure o escritório em poucos minutos
          </h2>
          <p className="mt-1 max-w-2xl text-body text-muted-foreground">
            Complete estes passos para publicar a página, receber pedidos e organizar a carteira.
          </p>
          <div className="mt-3 max-w-md">
            <div className="mb-1 flex items-center justify-between text-caption text-muted-foreground">
              <span>
                {doneCount} de {STEPS.length} concluídos
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          {canStartOperating ? (
            <p className="mt-2 text-sm font-medium text-success">Já pode começar a operar no Teglion.</p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" className="mt-1 shrink-0 sm:mt-0" onClick={() => void complete()}>
          <CheckCircle2 className="h-4 w-4" />
          Marcar como concluído
        </Button>
      </div>

      {publicUrl ? (
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border/60 bg-card/80 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-caption font-medium text-muted-foreground">Página pública do escritório</p>
            <p className="truncate text-sm font-medium text-foreground">{publicUrl}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => void copyPublicUrl()}>
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
            <Button type="button" size="sm" variant="secondary" asChild>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Abrir
              </a>
            </Button>
          </div>
        </div>
      ) : null}

      <ul className="mt-5 space-y-2">
        {STEPS.map((step) => {
          const done = completed[step.id]
          const Icon = step.icon
          return (
            <li key={step.id}>
              <Link
                to={step.to}
                className={cn(
                  'flex items-start gap-3 rounded-lg border px-3 py-3 transition-colors',
                  done
                    ? 'border-success/20 bg-success/5'
                    : 'border-border/60 bg-card hover:border-brand/20 hover:bg-brand/[0.03]',
                )}
              >
                <span className="mt-0.5 shrink-0 text-muted-foreground">
                  {done ? (
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
    </section>
  )
}
