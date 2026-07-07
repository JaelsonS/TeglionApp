import { useMemo } from 'react'
import { ClientDocumentsView } from '@/features/client/views/ClientDocumentsView'
import { getClientHubCopy, toClientHubLocale } from '@/features/client/clientHubI18n'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'
import { isContabilMode } from '@/shared/config/productMode'
import { getInitialAppLocale } from '@/shared/i18n/appLocale'

export function ClientDocumentsPage() {
  const locale = useMemo(
    () => (isContabilMode() ? 'pt-PT' : toClientHubLocale(getInitialAppLocale())),
    [],
  )
  const t = useMemo(() => getClientHubCopy(locale), [locale])

  return (
    <div className="space-y-6" data-testid="client-documents-page">
      <PageHeader
        title="Documentos"
        subtitle="Envia ficheiros ao escritório e consulta o histórico dos teus envios"
      />
      <ClientDocumentsView t={t} />
    </div>
  )
}
