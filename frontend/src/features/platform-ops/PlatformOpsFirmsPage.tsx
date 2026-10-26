import { useState, type ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { platformOpsApi } from '@/infrastructure/api'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/utils/errors'

export function PlatformOpsFirmsPage() {
  const [q, setQ] = useState('')
  const query = useQuery({
    queryKey: ['platform-ops', 'firms', q],
    queryFn: () => platformOpsApi.firms({ limit: 50, q: q || undefined }),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Gabinetes</h1>
          <p className="text-sm text-muted-foreground">Lista cross-tenant (metadados, sem dados de clientes).</p>
        </div>
        <Input
          className="max-w-xs"
          placeholder="Procurar nome ou slug…"
          value={q}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
        />
      </div>
      {query.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
        </p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">{getErrorMessage(query.error)}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="px-3 py-2 font-medium">Slug</th>
                <th className="px-3 py-2 font-medium">Subscrição</th>
                <th className="px-3 py-2 font-medium">Criado</th>
              </tr>
            </thead>
            <tbody>
              {(query.data?.items || []).map((f) => (
                <tr key={f.id} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2 font-medium">{f.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{f.slug}</td>
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
