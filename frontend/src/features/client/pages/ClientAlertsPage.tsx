import { useMemo } from 'react'

import { ClientAlertsFeed } from '@/features/client/ClientAlertsFeed'
import { getClientHubCopy, toClientHubLocale } from '@/features/client/clientHubI18n'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'
import { isContabilMode } from '@/shared/config/productMode'
import { getInitialAppLocale } from '@/shared/i18n/appLocale'

export function ClientAlertsPage() {
  const locale = useMemo(
    () => (isContabilMode() ? 'pt-PT' : toClientHubLocale(getInitialAppLocale())),
    [],
  )
  const t = useMemo(() => getClientHubCopy(locale), [locale])

  return (
    <div className="space-y-6" data-testid="client-alerts-page">
      <PageHeader
        title={t.tabs.alerts}
        subtitle="Comunicados, avisos fiscais e actualizações do seu escritório"
      />
      <ClientAlertsFeed />
    </div>
  )
}
