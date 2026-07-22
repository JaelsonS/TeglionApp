import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar,
  FileText,
  Inbox,
  MessageSquare,
  Newspaper,
  Sparkles,
  Upload,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'

import type { ClientAlertItem } from '@/infrastructure/api/contabil/broadcasts'
import type { getClientHubCopy } from '@/features/client/clientHubI18n'
import {
  ClientContactFirmCta,
  ClientFirstVisitOnboarding,
} from '@/features/client/ClientContactAndOnboarding'
import { ClientPushOptIn } from '@/features/client/ClientPushOptIn'
import { PwaInstallBanner } from '@/shared/components/pwa/PwaInstallBanner'
import {
  DocumentPreviewModal,
  getViewSessionId,
} from '@/shared/components/contabil/DocumentPreviewModal'
import { clientPortalContabilApi, fetchDocumentPreviewUrl } from '@/infrastructure/api'
import { clientDocumentDisplayName } from '@/shared/utils/clientDocumentLabel'
import { isNewsArticleRead, useClientNewsReadVersion } from '@/shared/utils/clientNewsRead'
import { getErrorMessage } from '@/shared/utils/errors'
import type { ContabilDocument, ContabilHubSummary, FiscalHealth, NewsArticle, Obligation } from '@/shared/types/contabil'
import { formatPtDate } from '@/shared/utils/contabilLocale'
import { cn } from '@/shared/lib/utils'

function isOverdue(o: Obligation) {
  if (o.paymentStatus === 'PAID') return false
  return new Date(o.dueDate) < new Date()
}

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
  onGoBooking: () => void
  onOpenObligation: (o: Obligation) => void
  onOpenNews?: (article: NewsArticle) => void
}

/** Início — dashboard de valor para o cliente. */
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
  onGoBooking,
  onOpenObligation,
  onOpenNews,
}: Props) {
  const readVersion = useClientNewsReadVersion()
  const goMessages = onGoMessages || onGoAlerts
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  const pendingObligations = hub.obligations.filter(
    (o) => o.paymentStatus !== 'PAID' && (isOverdue(o) || o.status !== 'DELIVERED'),
  )

  const firmDocuments = hub.documents
    .filter((d) => d.uploadedByRole === 'FIRM')
    .slice(0, 3)

  const newsPreview = recentNews.slice(0, 3)
  const now = Date.now()
  const dueSoonCount = hub.obligations.filter((o) => {
    if (o.paymentStatus === 'PAID') return false
    const due = new Date(o.dueDate).getTime()
    if (Number.isNaN(due)) return false
    return due >= now && due <= now + 7 * 24 * 60 * 60 * 1000
  }).length
  const overdueCount = hub.obligations.filter((o) => isOverdue(o)).length
  const pendingPaymentsCount = hub.obligations.filter((o) => o.paymentStatus !== 'PAID').length
  const newDocsCount = hub.documents.filter((d) => {
    if (d.uploadedByRole !== 'FIRM' || !d.createdAt) return false
    const created = new Date(d.createdAt).getTime()
    if (Number.isNaN(created)) return false
    return now - created <= 14 * 24 * 60 * 60 * 1000
  }).length

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
    <div className="space-y-6">
      <ClientFirstVisitOnboarding
        onGoDocuments={onGoDocuments}
        onGoObligations={onGoObligations}
        onGoMessages={goMessages}
        onInstallHint={() => {
          document.getElementById('client-pwa-install')?.scrollIntoView({ behavior: 'smooth' })
        }}
      />

      <PwaInstallBanner surface="client" className="scroll-mt-4" id="client-pwa-install" />

      <ClientPushOptIn />

      <ClientContactFirmCta
        firmName={hub.firm.name}
        contactPhone={hub.firm.contactPhone}
        onGoMessages={goMessages}
        onGoBooking={onGoBooking}
      />

      {urgentBanner && (!urgentBanner.isRead || urgentBanner.needsAck) ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-red-300/80 bg-gradient-to-r from-red-600 to-red-700 p-4 text-white shadow-lg"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="cb-text-label text-red-100">Urgente do escritório</p>
              <p className="mt-1 font-semibold">{urgentBanner.title}</p>
              {urgentBanner.excerpt ? <p className="mt-1 text-sm text-red-50">{urgentBanner.excerpt}</p> : null}
              <button
                type="button"
                className="mt-3 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                onClick={onGoAlerts}
              >
                Ver alerta
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'cb-card-padded',
          fiscalHealth === 'ok' && 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-card',
          fiscalHealth === 'attention' && 'border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-card',
          fiscalHealth === 'critical' && 'border-red-200/80 bg-gradient-to-br from-red-50/80 to-card',
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{hub.firm.name}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">{fiscalLabel}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {pendingObligations.length > 0
                ? `${pendingObligations.length} obrigação${pendingObligations.length > 1 ? 'ões' : ''} em aberto`
                : t.home.allClear}
            </p>
          </div>
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-2xl',
              fiscalHealth === 'ok' && 'bg-emerald-100 text-emerald-700',
              fiscalHealth === 'attention' && 'bg-amber-100 text-amber-800',
              fiscalHealth === 'critical' && 'bg-red-100 text-red-700',
            )}
          >
            {fiscalHealth === 'critical' ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t.home.period} {hub.period}
        </p>
      </motion.div>

      <section>
        <h3 className="cb-text-label">Hoje</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button type="button" className="cb-quick-action items-start text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onGoObligations}>
            <Calendar className="h-5 w-5 text-brand" />
            <span className="text-xs text-muted-foreground">Prazo próximo</span>
            <span className="text-sm font-semibold text-foreground">{dueSoonCount}</span>
          </button>
          <button type="button" className="cb-quick-action items-start text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onGoObligations}>
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-xs text-muted-foreground">Em atraso</span>
            <span className="text-sm font-semibold text-foreground">{overdueCount}</span>
          </button>
          <button type="button" className="cb-quick-action items-start text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onGoObligations}>
            <Wallet className="h-5 w-5 text-amber-700" />
            <span className="text-xs text-muted-foreground">Pagamentos pendentes</span>
            <span className="text-sm font-semibold text-foreground">{pendingPaymentsCount}</span>
          </button>
          <button type="button" className="cb-quick-action items-start text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onGoDocuments}>
            <FileText className="h-5 w-5 text-brand" />
            <span className="text-xs text-muted-foreground">Novos documentos</span>
            <span className="text-sm font-semibold text-foreground">{newDocsCount}</span>
          </button>
          <button
            type="button"
            className="cb-quick-action items-start text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={goMessages}
          >
            <MessageSquare className="h-5 w-5 text-brand" />
            <span className="text-xs text-muted-foreground">Novas mensagens</span>
            <span className="text-sm font-semibold text-foreground">{unreadMessagesCount}</span>
          </button>
          <button type="button" className="cb-quick-action items-start text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onGoRequests}>
            <Inbox className="h-5 w-5 text-brand" />
            <span className="text-xs text-muted-foreground">Novos pedidos</span>
            <span className="text-sm font-semibold text-foreground">{newRequestsCount}</span>
          </button>
        </div>
      </section>

      <section>
        <h3 className="cb-text-label">Ações rápidas</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Enviar documento', icon: Upload, onClick: onGoDocuments },
            { label: 'Agenda', icon: Wallet, onClick: onGoObligations },
            { label: 'Pedidos do escritório', icon: Inbox, onClick: onGoRequests },
            { label: 'Agendar reunião', icon: Calendar, onClick: onGoBooking },
          ].map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="cb-quick-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="h-5 w-5 text-brand" />
              <span className="text-xs font-semibold text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {newsPreview.length > 0 ? (
        <section className="cb-card-padded">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 cb-text-label text-brand">
              <Newspaper className="h-3.5 w-3.5" />
              Novidades do escritório
            </span>
            <button type="button" className="text-xs font-semibold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm" onClick={onGoNews}>
              Ver todas
            </button>
          </div>
          <ul className="space-y-2">
            {newsPreview.map((a) => {
              const id = a.id || a._id || ''
              void readVersion
              const unread = id ? !isNewsArticleRead(id) : false
              return (
                <li key={id || a.slug}>
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-2 rounded-xl bg-muted/30 px-3 py-2.5 text-left text-sm transition hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => (onOpenNews ? onOpenNews(a) : onGoNews())}
                  >
                    <span className="min-w-0">
                      <span className="font-medium text-foreground">{a.title}</span>
                      {a.publishedAt ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {formatPtDate(a.publishedAt)}
                        </span>
                      ) : null}
                    </span>
                    {unread ? (
                      <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-caption font-bold text-primary-foreground">
                        Novo
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      <section className="cb-card-padded">
        <h3 className="cb-text-label">Atividade recente</h3>
        <div className="mt-4 space-y-4">
          {firmDocuments.length > 0 ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  Documentos recebidos
                </span>
                <button type="button" className="text-xs font-semibold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm" onClick={onGoDocuments}>
                  Ver todos
                </button>
              </div>
              <ul className="space-y-2">
                {firmDocuments.map((d) => (
                  <li key={d._id}>
                    <button
                      type="button"
                      className="w-full rounded-xl bg-muted/20 px-3 py-2.5 text-left text-sm transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => void openDocument(d)}
                    >
                      <p className="font-medium text-foreground">{clientDocumentDisplayName(d)}</p>
                      <p className="text-xs text-muted-foreground">{d.createdAt ? formatPtDate(d.createdAt) : ''}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {pendingObligations.length > 0 ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Wallet className="h-3.5 w-3.5" />
                  Obrigações pendentes
                </span>
                <button type="button" className="text-xs font-semibold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm" onClick={onGoObligations}>
                  Ver todas
                </button>
              </div>
              <ul className="space-y-2">
                {pendingObligations.slice(0, 3).map((o) => (
                  <li key={o._id}>
                    <button type="button" className="w-full rounded-xl bg-muted/20 px-3 py-2.5 text-left text-sm transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onOpenObligation(o)}>
                      <p className="font-medium text-foreground">{o.title || o.type}</p>
                      <p className="text-xs text-muted-foreground">Prazo {formatPtDate(o.dueDate, 'date')}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onGoAlerts}
            className="flex w-full items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm text-foreground transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Bell className="h-4 w-4 shrink-0 text-brand" />
            <span>Alertas e avisos do escritório</span>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </button>

          {firmDocuments.length === 0 && pendingObligations.length === 0 && newsPreview.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center">
              <p className="text-sm text-muted-foreground">Tudo em dia — sem novidades por agora.</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button type="button" className="text-xs font-semibold text-brand" onClick={onGoDocuments}>
                  Enviar documento
                </button>
                <span className="text-muted-foreground">·</span>
                <button type="button" className="text-xs font-semibold text-brand" onClick={goMessages}>
                  Escrever mensagem
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

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
