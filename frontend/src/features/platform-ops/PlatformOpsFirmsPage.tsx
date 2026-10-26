import { useMemo, useState, type ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Loader2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { platformOpsApi } from '@/infrastructure/api'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/utils/errors'

const STATUS_OPTIONS = ['', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED'] as const

export function PlatformOpsFirmsPage() {
  const [params, setParams] = useSearchParams()
  const statusFromUrl = String(params.get('status') || '').toUpperCase()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState(statusFromUrl)

  const query = useQuery({
    queryKey: ['platform-ops', 'firms', q, status],
    queryFn: () =>
      platformOpsApi.firms({
        limit: 50,
        q: q || undefined,
        status: status || undefined,
      }),
  })

  const totalLabel = useMemo(() => {
    if (query.data?.total == null) return null
    return `${query.data.total} gabinete(s)`
  }, [query.data?.total])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Gabinetes</h1>
          <p className="text-sm text-muted-foreground">
            Lista cross-tenant (metadados). Clique numa linha para detalhe e acções.
            {totalLabel ? ` · ${totalLabel}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="max-w-xs"
            placeholder="Procurar nome ou slug…"
            value={q}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => {
              const next = e.target.value
              setStatus(next)
              const sp = new URLSearchParams(params)
              if (next) sp.set('status', next)
              else sp.delete('status')
              setParams(sp, { replace: true })
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s || 'all'} value={s}>
                {s || 'Todos os estados'}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              void platformOpsApi
                .exportCsv('firms', { q: q || undefined, status: status || undefined })
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
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="px-3 py-2 font-medium">Slug</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium">Subscrição</th>
                <th className="px-3 py-2 font-medium">Criado</th>
              </tr>
            </thead>
            <tbody>
              {(query.data?.items || []).map((f) => (
                <tr key={f.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">
                    <Link to={`/app/ops/firms/${f.id}`} className="text-brand hover:underline">
                      {f.name}
                    </Link>
                    {f.isNew24h ? (
                      <span className="ml-2 rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand">
                        Novo
                      </span>
                    ) : f.isNew7d ? (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        7d
                      </span>
                    ) : null}
                    {f.internalOps ? (
                      <span className="ml-2 text-[10px] uppercase text-muted-foreground">ops</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{f.slug}</td>
                  <td className="px-3 py-2 text-muted-foreground">{f.status || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{f.subscriptionStatus || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {new Date(f.createdAt).toLocaleDateString('pt-PT')}
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
