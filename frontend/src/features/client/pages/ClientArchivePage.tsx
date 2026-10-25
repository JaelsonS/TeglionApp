import { ClientArchiveView } from '@/features/client/views/ClientArchiveView'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'

export function ClientArchivePage() {
  return (
    <div className="space-y-6" data-testid="client-archive-page">
      <PageHeader
        title="Arquivo"
        subtitle="Documentos já validados pelo escritório — consulte e transfira por ano."
      />
      <ClientArchiveView />
    </div>
  )
}
