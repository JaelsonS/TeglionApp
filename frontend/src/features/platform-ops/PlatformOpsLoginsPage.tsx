import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { platformOpsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'

export function PlatformOpsLoginsPage() {
  const query = useQuery({
    queryKey: ['platform-ops', 'logins'],
    queryFn: () => platformOpsApi.loginAttempts({ limit: 80 }),
    refetchInterval: 60_000,
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Logins / lockout</h1>
        <p className="text-sm text-muted-foreground">
          Contas com falhas e bloqueios — base para blue/red team em staging.
        </p>
      </div>
      {query.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
        </p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">{getErrorMessage(query.error)}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Conta</th>
                <th className="px-3 py-2 font-medium">Falhas</th>
                <th className="px-3 py-2 font-medium">IP</th>
                <th className="px-3 py-2 font-medium">Lock até</th>
                <th className="px-3 py-2 font-medium">Última tentativa</th>
              </tr>
            </thead>
            <tbody>
              {(query.data?.items || []).map((row) => (
                <tr key={row.accountKey} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{row.accountKey}</td>
                  <td className="px-3 py-2 tabular-nums">{row.failedCount}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.lastIp || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.lockedUntil ? new Date(row.lockedUntil).toLocaleString('pt-PT') : '—'}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.lastAttemptAt ? new Date(row.lastAttemptAt).toLocaleString('pt-PT') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
