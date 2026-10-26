import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { platformOpsApi } from '@/infrastructure/api'
import { Button } from '@/shared/components/ui/button'
import { getErrorMessage } from '@/shared/utils/errors'

export function PlatformOpsLoginsPage() {
  const [lockedOnly, setLockedOnly] = useState(false)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['platform-ops', 'logins', lockedOnly],
    queryFn: () => platformOpsApi.loginAttempts({ limit: 80, lockedOnly }),
    refetchInterval: 60_000,
  })

  const clear = useMutation({
    mutationFn: (accountKey: string) => platformOpsApi.clearLockout(accountKey),
    onSuccess: () => {
      toast.success('Lockout limpo.')
      void qc.invalidateQueries({ queryKey: ['platform-ops'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Logins / lockout</h1>
          <p className="text-sm text-muted-foreground">
            Contas com falhas e bloqueios — base para blue/red team em staging.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={lockedOnly}
              onChange={(e) => setLockedOnly(e.target.checked)}
            />
            Só em lockout
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              void platformOpsApi
                .exportCsv('logins', { lockedOnly: lockedOnly ? '1' : undefined })
                .catch((err) => toast.error(getErrorMessage(err)))
            }}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>
      {query.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
        </p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">{getErrorMessage(query.error)}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Conta</th>
                <th className="px-3 py-2 font-medium">Falhas</th>
                <th className="px-3 py-2 font-medium">IP</th>
                <th className="px-3 py-2 font-medium">Lock até</th>
                <th className="px-3 py-2 font-medium">Última tentativa</th>
                <th className="px-3 py-2 font-medium">Acção</th>
              </tr>
            </thead>
            <tbody>
              {(query.data?.items || []).map((row) => {
                const locked =
                  row.lockedUntil && new Date(row.lockedUntil).getTime() > Date.now()
                return (
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
                    <td className="px-3 py-2">
                      {locked ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={clear.isPending}
                          onClick={() => {
                            if (window.confirm(`Limpar lockout de ${row.accountKey}?`)) {
                              clear.mutate(row.accountKey)
                            }
                          }}
                        >
                          Limpar
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
