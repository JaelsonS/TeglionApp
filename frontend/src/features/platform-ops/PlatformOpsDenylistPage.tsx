import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { toast } from 'sonner'

import { platformOpsApi } from '@/infrastructure/api'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/utils/errors'

export function PlatformOpsDenylistPage() {
  const qc = useQueryClient()
  const [ip, setIp] = useState('')
  const [reason, setReason] = useState('')

  const query = useQuery({
    queryKey: ['platform-ops', 'denylist'],
    queryFn: () => platformOpsApi.listIpDenylist({ limit: 100 }),
    refetchInterval: 60_000,
  })

  const add = useMutation({
    mutationFn: () => platformOpsApi.addIpDenylist({ ip: ip.trim(), reason: reason.trim() || undefined }),
    onSuccess: (res) => {
      toast.success(res.already ? 'IP já estava na denylist.' : `IP ${res.ip} bloqueado.`)
      setIp('')
      setReason('')
      void qc.invalidateQueries({ queryKey: ['platform-ops'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const revoke = useMutation({
    mutationFn: (id: string) => platformOpsApi.revokeIpDenylist({ id }),
    onSuccess: (res) => {
      toast.success(`IP ${res.ip} removido da denylist.`)
      void qc.invalidateQueries({ queryKey: ['platform-ops'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Denylist IP</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bloqueio na API (Render). Não use o vosso IP público de gestão. IPs privados/locais são rejeitados.
          Cloudflare edge sync fica para endurecimento posterior.
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-2 rounded-xl border border-border/70 p-3"
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (!ip.trim()) return
          add.mutate()
        }}
      >
        <label className="min-w-[10rem] flex-1 text-sm">
          <span className="text-muted-foreground">IP público</span>
          <Input
            className="mt-1 font-mono"
            placeholder="203.0.113.10"
            value={ip}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setIp(e.target.value)}
            autoComplete="off"
          />
        </label>
        <label className="min-w-[12rem] flex-[2] text-sm">
          <span className="text-muted-foreground">Motivo (opcional)</span>
          <Input
            className="mt-1"
            placeholder="ex.: spike login staging"
            value={reason}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setReason(e.target.value)}
          />
        </label>
        <Button type="submit" size="sm" disabled={add.isPending || !ip.trim()}>
          {add.isPending ? 'A bloquear…' : 'Bloquear'}
        </Button>
      </form>

      {query.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
        </p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">{getErrorMessage(query.error)}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">IP</th>
                <th className="px-3 py-2 font-medium">Motivo</th>
                <th className="px-3 py-2 font-medium">Desde</th>
                <th className="px-3 py-2 font-medium">Acção</th>
              </tr>
            </thead>
            <tbody>
              {(query.data?.items || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-muted-foreground">
                    Nenhum IP na denylist activa.
                  </td>
                </tr>
              ) : (
                query.data!.items.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">{row.ip}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.reason || '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString('pt-PT')}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={revoke.isPending}
                        onClick={() => {
                          if (window.confirm(`Remover ${row.ip} da denylist?`)) {
                            revoke.mutate(row.id)
                          }
                        }}
                      >
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
