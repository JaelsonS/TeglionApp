import { ClientDocumentRequestsPanel } from '@/features/client/ClientDocumentRequestsPanel'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'

export function ClientRequestsPage() {
  return (
    <div className="space-y-6" data-testid="client-requests-page">
      <PageHeader
        title="Pedidos"
        subtitle="Documentos e informações que o escritório lhe pediu. Entregue aqui — fica registado."
      />
      <ClientDocumentRequestsPanel />
    </div>
  )
}
