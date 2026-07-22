import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { ClientPremiumHome } from '@/features/client/ClientPremiumHome'
import { ClientHubFallback } from '@/features/client/ClientHubFallback'
import { getClientHubCopy, toClientHubLocale } from '@/features/client/clientHubI18n'
import { fetchClientAlerts } from '@/infrastructure/api/contabil/broadcasts'
import { clientPortalContabilApi } from '@/infrastructure/api'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'
import { isContabilMode } from '@/shared/config/productMode'
import { useClientPortalHub } from '@/shared/hooks/queries/useClientPortalHub'
import { useClientNewsFeed } from '@/shared/hooks/useClientNews'
import { useAuth } from '@/shared/hooks/useAuth'
import { getInitialAppLocale } from '@/shared/i18n/appLocale'
import type { FiscalHealth } from '@/shared/types/contabil'
import { Skeleton } from '@/shared/design-system'

function greetingName(fullName?: string) {
  const first = (fullName || '').trim().split(/\s+/)[0]
  return first || 'Olá'
}

function formatTodayPt() {
  return new Intl.DateTimeFormat('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function resolveFiscalHealth(hub: {
  fiscalHealth?: FiscalHealth
  counts: { obligationsOverdue: number; obligationsOpen: number }
}): FiscalHealth {
  if (hub.fiscalHealth) return hub.fiscalHealth
  if (hub.counts.obligationsOverdue > 0) return 'critical'
  if (hub.counts.obligationsOpen > 0) return 'attention'
  return 'ok'
}

export function ClientDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const locale = useMemo(
    () => (isContabilMode() ? 'pt-PT' : toClientHubLocale(getInitialAppLocale())),
    [],
  )
  const t = useMemo(() => getClientHubCopy(locale), [locale])

  const hubQuery = useClientPortalHub()
  const newsQuery = useClientNewsFeed()
  const alertsQuery = useQuery({
    queryKey: ['client', 'alerts', 'preview'],
    queryFn: () => fetchClientAlerts({}),
    staleTime: 45_000,
  })
  const unreadMessagesQuery = useQuery({
    queryKey: ['client', 'messages', 'unread-count'],
    queryFn: () => clientPortalContabilApi.getMessagesUnreadCount(),
    staleTime: 45_000,
  })
  const documentRequestsQuery = useQuery({
    queryKey: ['client', 'document-requests', 'count'],
    queryFn: () => clientPortalContabilApi.listDocumentRequests() as Promise<{ items?: Array<{ status?: string | null }> }>,
    staleTime: 45_000,
  })

  const hub = hubQuery.data
  const fiscalHealth = hub ? resolveFiscalHealth(hub) : 'ok'
  const fiscalLabel =
    fiscalHealth === 'critical'
      ? t.home.fiscalCritical
      : fiscalHealth === 'attention'
        ? t.home.fiscalAttention
        : t.home.fiscalOk

  const recentNews = useMemo(() => {
    const featured = newsQuery.featured || []
    const items = newsQuery.items || []
    return [...featured, ...items.filter((a) => !featured.some((f) => f.slug === a.slug))].slice(0, 5)
  }, [newsQuery.featured, newsQuery.items])

  const urgentBanner = alertsQuery.data?.urgentBanner
  const unreadMessagesCount = unreadMessagesQuery.data?.total || 0
  const newRequestsCount = (documentRequestsQuery.data?.items || []).filter((r) => {
    const status = String(r.status || '').toLowerCase()
    return status === 'pending' || status === 'seen'
  }).length

  return (
    <div data-testid="client-dashboard-page" className="space-y-6">
      <PageHeader
        title={`Olá, ${greetingName(user?.fullName)} 👋`}
        subtitle={formatTodayPt()}
      />

      {hubQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : null}

      {hubQuery.isError ? (
        <ClientHubFallback onRetry={() => void hubQuery.refetch()} retrying={hubQuery.isFetching} />
      ) : null}

      {hub ? (
        <ClientPremiumHome
          t={t}
          hub={hub}
          fiscalHealth={fiscalHealth}
          fiscalLabel={fiscalLabel}
          recentNews={recentNews}
          urgentBanner={urgentBanner}
          unreadMessagesCount={unreadMessagesCount}
          newRequestsCount={newRequestsCount}
          onGoObligations={() => navigate('/app/client/agenda')}
          onGoDocuments={() => navigate('/app/client/documents')}
          onGoMessages={() => navigate('/app/client/messages')}
          onGoAlerts={() => navigate('/app/client/updates')}
          onGoNews={() => navigate('/app/client/updates?tab=news')}
          onGoRequests={() => navigate('/app/client/requests')}
          onGoBooking={() => navigate('/app/client/agenda?view=consultoria')}
          onOpenObligation={(o) => navigate(`/app/client/agenda?obligation=${o._id}`)}
          onOpenNews={(a) => navigate(`/app/client/updates?tab=news&slug=${encodeURIComponent(a.slug)}`)}
        />
      ) : null}
    </div>
  )
}
