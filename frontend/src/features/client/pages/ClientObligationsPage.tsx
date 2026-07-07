import { useMemo } from 'react'

import { ClientObligationsView } from '@/features/client/views/ClientObligationsView'
import { getClientHubCopy, toClientHubLocale } from '@/features/client/clientHubI18n'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'
import { isContabilMode } from '@/shared/config/productMode'
import { getInitialAppLocale } from '@/shared/i18n/appLocale'

export function ClientObligationsPage() {
  const locale = useMemo(
    () => (isContabilMode() ? 'pt-PT' : toClientHubLocale(getInitialAppLocale())),
    [],
  )
  const t = useMemo(() => getClientHubCopy(locale), [locale])

  return (
    <div className="space-y-4" data-testid="client-obligations-page">
      <PageHeader
        title="Agenda fiscal"
        subtitle="Linha do tempo das obrigações enviadas pelo escritório, com estados, prazos e anexos"
      />
      <ClientObligationsView t={t} />
    </div>
  )
}
