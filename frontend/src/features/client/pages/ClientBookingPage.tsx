import { useMemo } from 'react'
import { Link } from 'react-router-dom'

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
        subtitle="Marca uma consultoria com o escritório — horários disponíveis dentro do Teglion"
      />
      <p className="rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Prefere escrever primeiro?{' '}
        <Link to="/app/client/messages" className="font-semibold text-brand hover:underline">
          Abrir mensagens
        </Link>
      </p>
      <ClientBookingPanel t={t} />
    </div>
  )
}
