import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Archive } from 'lucide-react'

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
        subtitle="Envie ficheiros ao escritório e veja o histórico dos seus envios"
      />
      <ClientDocumentsView t={t} />
      <Link
        to="/app/client/archive"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Archive className="h-4 w-4" aria-hidden />
        Ver arquivo completo
      </Link>
    </div>
  )
}
