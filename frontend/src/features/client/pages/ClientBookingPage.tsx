import { useMemo } from 'react'

import { ClientBookingPanel } from '@/features/client/ClientBookingPanel'
import { getClientHubCopy, toClientHubLocale } from '@/features/client/clientHubI18n'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'
import { isContabilMode } from '@/shared/config/productMode'
import { getInitialAppLocale } from '@/shared/i18n/appLocale'

export function ClientBookingPage() {
  const locale = useMemo(
    () => (isContabilMode() ? 'pt-PT' : toClientHubLocale(getInitialAppLocale())),
    [],
  )
  const t = useMemo(() => getClientHubCopy(locale), [locale])

  return (
    <div className="space-y-6" data-testid="client-booking-page">
      <PageHeader
        title={t.tabs.booking}
        subtitle="Marca uma reunião com o teu contabilista num horário disponível"
      />
      <ClientBookingPanel t={t} />
    </div>
  )
}
