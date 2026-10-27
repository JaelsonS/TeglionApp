import { useState, type ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { platformOpsApi } from '@/infrastructure/api'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/utils/errors'

export function PlatformOpsAuditPage() {
  const [action, setAction] = useState('')
  const [firmId, setFirmId] = useState('')
  const [since, setSince] = useState('')

  const query = useQuery({
    queryKey: ['platform-ops', 'audit', action, firmId, since],
    queryFn: () =>
      platformOpsApi.auditLogs({
        limit: 80,
        action: action.trim() || undefined,
        firmId: firmId.trim() || undefined,
        since: since ? new Date(since).toISOString() : undefined,
      }),
    refetchInterval: 45_000,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Audit log</h1>
          <p className="text-sm text-muted-foreground">
            Eventos recentes em todos os gabinetes — IP quando registado. Actualiza a cada ~45s.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            void platformOpsApi
              .exportCsv('audit', {
                action: action.trim() || undefined,
                firmId: firmId.trim() || undefined,
                since: since ? new Date(since).toISOString() : undefined,
              })
              .catch((err) => toast.error(getErrorMessage(err)))
          }}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-[14rem]"
          placeholder="Filtrar action…"
          value={action}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setAction(e.target.value)}
        />
        <Input
          className="max-w-[16rem]"
          placeholder="firmId (UUID)"
          value={firmId}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setFirmId(e.target.value)}
        />
        <Input
          className="max-w-[12rem]"
          type="date"
          value={since}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSince(e.target.value)}
        />
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
