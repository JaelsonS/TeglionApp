import { useMemo } from 'react'

import { ClientMessagesPanel } from '@/features/client/ClientMessagesPanel'
import { getClientHubCopy, toClientHubLocale } from '@/features/client/clientHubI18n'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'
import { isContabilMode } from '@/shared/config/productMode'
import { getInitialAppLocale } from '@/shared/i18n/appLocale'

export function ClientMessagesPage() {
  const locale = useMemo(
    () => (isContabilMode() ? 'pt-PT' : toClientHubLocale(getInitialAppLocale())),
    [],
  )
  const t = useMemo(() => getClientHubCopy(locale), [locale])

  return (
    <div className="space-y-6" data-testid="client-messages-page">
      <PageHeader
        title="Mensagens"
        subtitle="Conversa com o teu contabilista — pedidos formais ficam no separador Pedidos"
      />
      <ClientMessagesPanel t={t} />
    </div>
  )
}
