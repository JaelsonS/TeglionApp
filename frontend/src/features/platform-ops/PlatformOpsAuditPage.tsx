import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { platformOpsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'

export function PlatformOpsAuditPage() {
  const query = useQuery({
    queryKey: ['platform-ops', 'audit'],
    queryFn: () => platformOpsApi.auditLogs({ limit: 80 }),
    refetchInterval: 45_000,
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Eventos recentes em todos os gabinetes — IP quando registado. Actualiza a cada ~45s.
        </p>
      </div>
      {query.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
        </p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">{getErrorMessage(query.error)}</p>
      ) : (
        <ul className="space-y-2">
          {(query.data?.items || []).map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-border/60 bg-card px-3 py-2.5 text-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{item.action}</p>
                <time className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString('pt-PT')}
                </time>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.actorRole || '—'} · firm {item.firmId ? item.firmId.slice(0, 8) : 'platform'} · IP{' '}
                {item.ipAddress || '—'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
