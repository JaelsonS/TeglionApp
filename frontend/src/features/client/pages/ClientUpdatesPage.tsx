import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { ClientAlertsFeed } from '@/features/client/ClientAlertsFeed'
import { ClientNewsFeed } from '@/features/client/ClientNewsFeed'
import { getClientHubCopy, toClientHubLocale } from '@/features/client/clientHubI18n'
import {
  patchUpdatesTabSearchParams,
  updatesTabFromSearch,
  type UpdatesTab,
} from '@/features/client/clientUpdatesSearch'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'
import { isContabilMode } from '@/shared/config/productMode'
import { getInitialAppLocale } from '@/shared/i18n/appLocale'
import { cn } from '@/shared/lib/utils'

/** Alertas + notícias do escritório numa só página. */
export function ClientUpdatesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const locale = useMemo(
    () => (isContabilMode() ? 'pt-PT' : toClientHubLocale(getInitialAppLocale())),
    [],
  )
  const t = useMemo(() => getClientHubCopy(locale), [locale])

  const urlTab = updatesTabFromSearch(searchParams)
  const [tab, setTabState] = useState<UpdatesTab>(urlTab)

  useEffect(() => {
    setTabState(urlTab)
  }, [urlTab])

  const setTab = (next: UpdatesTab) => {
    setTabState(next)
    setSearchParams((prev) => patchUpdatesTabSearchParams(prev, next), { replace: true })
  }

  return (
    <div className="space-y-6" data-testid="client-updates-page">
      <PageHeader
        title="Avisos"
        subtitle="O que o escritório quer que saiba — alertas rápidos e novidades"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={tab === 'alerts'}
          data-testid="client-updates-tab-alerts"
          onClick={() => setTab('alerts')}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            tab === 'alerts'
              ? 'bg-brand text-primary-foreground'
              : 'border border-border bg-card text-foreground hover:bg-muted',
          )}
        >
          {t.tabs.alerts}
        </button>
        <button
          type="button"
          aria-pressed={tab === 'news'}
          data-testid="client-updates-tab-news"
          onClick={() => setTab('news')}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            tab === 'news'
              ? 'bg-brand text-primary-foreground'
              : 'border border-border bg-card text-foreground hover:bg-muted',
          )}
        >
          {t.tabs.news}
        </button>
      </div>

      {tab === 'news' ? <ClientNewsFeed /> : <ClientAlertsFeed />}
    </div>
  )
}
