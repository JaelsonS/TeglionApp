import { useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'

import { contabilClientsApi } from '@/infrastructure/api'

const STATUS_LABELS: Record<string, string> = {
  NO_ACCESS: 'Sem acesso',
  PENDING_INVITE: 'Convite pendente',
  ACTIVE: 'Acesso activo',
  REVOKED: 'Acesso revogado',
}

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/**
 * Linha do tempo de acesso ao portal — lê audit_logs (convites, aceitação, revogação).
 */
export function ClientAccessHistory({ clientId }: { clientId: string }) {
  const query = useQuery({
    queryKey: ['client-access-history', clientId],
    queryFn: () => contabilClientsApi.getAccessHistory(clientId),
    enabled: Boolean(clientId),
  })

  const items = query.data?.items || []
  const status = query.data?.portalAccessStatus

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-brand" aria-hidden />
        <h2 className="text-sm font-semibold text-foreground">Histórico de acesso</h2>
        {status ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-caption text-muted-foreground">
            {STATUS_LABELS[status] || status}
          </span>
        ) : null}
      </div>

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">A carregar histórico…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ainda não há eventos de acesso para este cliente.</p>
      ) : (
        <ol className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 border-l-2 border-brand/30 pl-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{formatWhen(item.createdAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
