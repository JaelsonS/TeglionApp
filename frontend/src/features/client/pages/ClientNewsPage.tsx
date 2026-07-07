import { useMemo } from 'react'

import { ClientNewsFeed } from '@/features/client/ClientNewsFeed'
import { getClientHubCopy, toClientHubLocale } from '@/features/client/clientHubI18n'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'
import { isContabilMode } from '@/shared/config/productMode'
import { getInitialAppLocale } from '@/shared/i18n/appLocale'

export function ClientNewsPage() {
  const locale = useMemo(
    () => (isContabilMode() ? 'pt-PT' : toClientHubLocale(getInitialAppLocale())),
    [],
  )
  const t = useMemo(() => getClientHubCopy(locale), [locale])

  return (
    <div className="space-y-6" data-testid="client-news-page">
      <PageHeader
        title={t.tabs.news}
        subtitle="Artigos e novidades publicados pelo teu contabilista"
      />
      <ClientNewsFeed />
    </div>
  )
}
