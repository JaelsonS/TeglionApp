import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Briefcase,
  CalendarDays,
  FileText,
  Inbox,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

import type { ClientAlertItem } from '@/infrastructure/api/contabil/broadcasts'
import type { getClientHubCopy } from '@/features/client/clientHubI18n'
import { clusterPortalServices } from '@/features/client/clusterPortalServices'
import { ClientFirstVisitOnboarding } from '@/features/client/ClientContactAndOnboarding'
import { deadlineBucket } from '@/features/client/groupClientDeadlines'
import { pickClientNextStep } from '@/features/client/pickClientNextStep'
import { AskMayaButton } from '@/features/maya'
import {
  DocumentPreviewModal,
  getViewSessionId,
} from '@/shared/components/contabil/DocumentPreviewModal'
import { Button } from '@/shared/components/ui/button'
import { clientPortalContabilApi, fetchDocumentPreviewUrl } from '@/infrastructure/api'
import { clientDocumentDisplayName } from '@/shared/utils/clientDocumentLabel'
import { getErrorMessage } from '@/shared/utils/errors'
import type { AccountingService, ContabilDocument, ContabilHubSummary, FiscalHealth, NewsArticle, Obligation } from '@/shared/types/contabil'
import { cn } from '@/shared/lib/utils'

type Props = {
  t: ReturnType<typeof getClientHubCopy>
  hub: ContabilHubSummary
  fiscalHealth: FiscalHealth
  fiscalLabel: string
  recentNews?: NewsArticle[]
  urgentBanner?: ClientAlertItem | null
  unreadMessagesCount?: number
  newRequestsCount?: number
  onGoObligations: () => void
  onGoDocuments: () => void
  onGoMessages?: () => void
  onGoAlerts: () => void
  onGoNews: () => void
  onGoRequests: () => void
  onGoServices: () => void
  onOpenObligation: (o: Obligation) => void
  onOpenNews?: (article: NewsArticle) => void
  onOpenService?: (serviceId: string) => void
}

function formatEuro(cents: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

/** Início — um próximo passo, o essencial, e os serviços do escritório. */
export function ClientPremiumHome({
  t,
  hub,
  fiscalHealth,
  fiscalLabel,
  recentNews = [],
  urgentBanner,
  unreadMessagesCount = 0,
  newRequestsCount = 0,
  onGoObligations,
  onGoDocuments,
  onGoMessages,
  onGoAlerts,
  onGoNews,
  onGoRequests,
  onGoServices,
  onOpenObligation,
  onOpenNews,
  onOpenService,
}: Props) {
  const goMessages = onGoMessages || onGoAlerts
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  const pendingObligations = hub.obligations.filter(
    (o) => o.paymentStatus !== 'PAID' && o.status !== 'CANCELLED',
  )
  const overdueCount = pendingObligations.filter((o) => deadlineBucket(o.dueDate) === 'overdue').length
  const dueThisWeekCount = pendingObligations.filter((o) => deadlineBucket(o.dueDate) === 'thisWeek').length

  const nextStep = pickClientNextStep({
    overdueCount,
    pendingRequestsCount: newRequestsCount,
    unreadMessagesCount,
    dueThisWeekCount,
  })

  const firmDocuments = hub.documents.filter((d) => d.uploadedByRole === 'FIRM').slice(0, 3)
  const newsPreview = recentNews.slice(0, 2)
  const nextObligation = pendingObligations
    .slice()
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]

  const servicesQuery = useQuery({
    queryKey: ['client', 'booking-services', 'home'],
    queryFn: () => clientPortalContabilApi.listBookingServices() as Promise<{ items?: AccountingService[] }>,
    staleTime: 60_000,
  })
  const servicePreview = useMemo(() => {
    const items = (servicesQuery.data?.items || []).filter((s) => s.isActive !== false)
    return clusterPortalServices(items).flatMap((c) => c.items).slice(0, 4)
  }, [servicesQuery.data?.items])

  const chips = [
    { label: 'Pedidos', value: newRequestsCount, onClick: onGoRequests, icon: Inbox },
    { label: 'Mensagens', value: unreadMessagesCount, onClick: goMessages, icon: MessageSquare },
    { label: 'Prazos', value: overdueCount || dueThisWeekCount, onClick: onGoObligations, icon: CalendarDays, warn: overdueCount > 0 },
  ]

  async function openDocument(d: ContabilDocument) {
    setPreviewTitle(clientDocumentDisplayName(d))
    setPreviewOpen(true)
    setPreviewLoading(true)
    setPreviewUrl(null)
    try {
      await clientPortalContabilApi.recordDocumentView(d._id, getViewSessionId())
      const url = await fetchDocumentPreviewUrl(d._id, 'client')
      setPreviewUrl(url)
    } catch (err) {
      toast.error('Não foi possível abrir o documento', { description: getErrorMessage(err) })
      setPreviewOpen(false)
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <ClientFirstVisitOnboarding
        onGoDocuments={onGoDocuments}
        onGoObligations={onGoObligations}
        onGoMessages={goMessages}
      />

      {urgentBanner && (!urgentBanner.isRead || urgentBanner.needsAck) ? (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/90 p-4 text-red-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
            <div className="min-w-0 flex-1">
              <p className="cb-text-label text-red-800">Urgente do escritório</p>
              <p className="mt-1 font-display text-lg font-semibold">{urgentBanner.title}</p>
              {urgentBanner.excerpt ? <p className="mt-1 text-sm text-red-900/80">{urgentBanner.excerpt}</p> : null}
              <Button type="button" size="sm" className="mt-3 rounded-full" onClick={onGoAlerts}>
                Ver aviso
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
        <section
          className={cn(
            'pc-next-step',
            nextStep.tone === 'critical' && 'pc-next-step-critical',
            nextStep.tone === 'attention' && 'pc-next-step-attention',
            nextStep.tone === 'ok' && 'pc-next-step-ok',
          )}
          data-testid="client-next-step"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="cb-text-label text-brand">Próximo passo</p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
                {nextStep.title}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{nextStep.description}</p>
            </div>
            <span
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                nextStep.tone === 'critical' && 'bg-red-100 text-red-700',
                nextStep.tone === 'attention' && 'bg-amber-100 text-amber-800',
                nextStep.tone === 'ok' && 'bg-emerald-100 text-emerald-700',
              )}
            >
              {nextStep.tone === 'ok' ? <Sparkles className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              className="rounded-full"
              onClick={() => {
                if (nextStep.to === '/app/client/agenda') onGoObligations()
                else if (nextStep.to === '/app/client/requests') onGoRequests()
                else if (nextStep.to === '/app/client/messages') goMessages()
                else onGoServices()
              }}
            >
              {nextStep.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <AskMayaButton intentId={nextStep.mayaIntentId} />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {hub.firm.name}
            {fiscalHealth !== 'ok' ? ` · ${fiscalLabel}` : ` · ${t.home.allClear}`}
          </p>
        </section>

        <aside className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {chips.map(({ label, value, onClick, icon: Icon, warn }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className="rounded-2xl border border-border/70 bg-card px-2 py-3 text-center shadow-[var(--cb-shadow-card)] transition hover:border-brand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className={cn('mx-auto h-4 w-4', warn ? 'text-red-600' : 'text-brand')} aria-hidden />
                <p className="mt-1.5 font-display text-lg font-semibold tabular-nums text-foreground">{value}</p>
                <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
              </button>
            ))}
          </div>
          {nextObligation ? (
            <button
              type="button"
              className="pc-deadline-row w-full"
              onClick={() => onOpenObligation(nextObligation)}
            >
              <CalendarDays className="h-4 w-4 shrink-0 text-brand" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {nextObligation.title || nextObligation.type}
                </span>
                <span className="block text-xs text-muted-foreground">Toque para o detalhe do prazo</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : null}
        </aside>
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">Serviços do escritório</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">Peça ou agende sem sair do portal.</p>
          </div>
          <button
            type="button"
            className="text-sm font-semibold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            onClick={onGoServices}
          >
            Ver todos
          </button>
        </div>
        {servicePreview.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {servicePreview.map((s) => (
              <button
                key={s.id}
                type="button"
                className="pc-service-card text-left"
                onClick={() => (onOpenService ? onOpenService(s.id) : onGoServices())}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Briefcase className="h-4 w-4" aria-hidden />
                </span>
                <p className="mt-3 font-display text-sm font-semibold text-foreground">{s.name}</p>
                {s.description ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                ) : null}
                <p className="mt-auto pt-3 text-xs font-medium text-brand">
                  {s.requiresBooking ? 'Agendar' : 'Pedir'}
                  {s.priceCents ? ` · ${formatEuro(s.priceCents)}` : ''}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={goMessages}
            className="flex w-full items-center justify-between rounded-2xl border border-dashed border-border bg-card/60 px-4 py-5 text-left"
          >
            <span>
              <span className="block text-sm font-semibold text-foreground">Falar com o escritório</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Ainda não há serviços publicados neste portal.
              </span>
            </span>
            <MessageSquare className="h-5 w-5 text-brand" />
          </button>
        )}
      </section>

      {newsPreview.length > 0 || firmDocuments.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {newsPreview.length > 0 ? (
            <section className="cb-card-padded">
              <div className="mb-3 flex items-center justify-between">
                <span className="cb-text-label text-brand">Do escritório</span>
                <button type="button" className="text-xs font-semibold text-brand" onClick={onGoNews}>
                  Ver avisos
                </button>
              </div>
              <ul className="space-y-2">
                {newsPreview.map((a) => (
                  <li key={a.id || a._id || a.slug}>
                    <button
                      type="button"
                      className="w-full rounded-xl bg-muted/30 px-3 py-2.5 text-left text-sm transition hover:bg-brand/5"
                      onClick={() => (onOpenNews ? onOpenNews(a) : onGoNews())}
                    >
                      <span className="font-medium text-foreground">{a.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {firmDocuments.length > 0 ? (
            <section className="cb-card-padded">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 cb-text-label">
                  <FileText className="h-3.5 w-3.5" />
                  Documentos recebidos
                </span>
                <button type="button" className="text-xs font-semibold text-brand" onClick={onGoDocuments}>
                  Ver todos
                </button>
              </div>
              <ul className="space-y-2">
                {firmDocuments.map((d) => (
                  <li key={d._id}>
                    <button
                      type="button"
                      className="w-full rounded-xl bg-muted/20 px-3 py-2.5 text-left text-sm transition hover:bg-muted/40"
                      onClick={() => void openDocument(d)}
                    >
                      <p className="font-medium text-foreground">{clientDocumentDisplayName(d)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onGoAlerts}
        className="flex w-full items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm text-foreground transition hover:border-brand/30"
      >
        <Bell className="h-4 w-4 shrink-0 text-brand" />
        <span>Avisos e novidades do escritório</span>
        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
      </button>

      <DocumentPreviewModal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false)
          setPreviewUrl(null)
        }}
        title={previewTitle}
        previewUrl={previewUrl}
        loading={previewLoading}
      />
    </div>
  )
}
