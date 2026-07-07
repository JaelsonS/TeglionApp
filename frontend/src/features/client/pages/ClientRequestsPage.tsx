import { ClientDocumentRequestsPanel } from '@/features/client/ClientDocumentRequestsPanel'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'

export function ClientRequestsPage() {
  return (
    <div className="space-y-6" data-testid="client-requests-page">
      <PageHeader
        title="Pedidos do teu contabilista"
        subtitle="Documentos e informações que te foram solicitados"
      />
      <ClientDocumentRequestsPanel />
    </div>
  )
}
