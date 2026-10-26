import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Loader2 } from 'lucide-react'

import { platformOpsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'

export function PlatformOpsSentryPage() {
  const query = useQuery({
    queryKey: ['platform-ops', 'sentry'],
    queryFn: () => platformOpsApi.sentryIssues({ limit: 25 }),
    refetchInterval: 120_000,
  })

  if (query.isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar Sentry…
      </p>
    )
  }

  if (query.isError) {
    return <p className="text-sm text-destructive">{getErrorMessage(query.error)}</p>
  }

  const data = query.data!
  const links = [
    data.projectUrl ? { href: data.projectUrl, label: 'Abrir projecto Sentry' } : null,
    data.issuesUrl ? { href: data.issuesUrl, label: 'Abrir issues' } : null,
  ].filter(Boolean) as Array<{ href: string; label: string }>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Sentry</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Link-out e resumo de issues (sem PII). Não substitui a consola Sentry.
        </p>
      </div>

      <div className="rounded-xl border border-border/70 bg-card px-4 py-3 text-sm">
        <p>
          <span className="text-muted-foreground">DSN configurado:</span>{' '}
          {data.dsnConfigured ? 'sim' : 'não'}
        </p>
        <p className="mt-1">
          <span className="text-muted-foreground">API token / org / project:</span>{' '}
          {data.configured ? 'ok' : 'em falta'}
          {data.org && data.project ? ` · ${data.org}/${data.project}` : ''}
        </p>
        {data.hint ? <p className="mt-2 text-amber-700 dark:text-amber-400">{data.hint}</p> : null}
        {links.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-brand hover:underline"
              >
                {l.label} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Defina SENTRY_ORG_SLUG e SENTRY_PROJECT_SLUG no Render para links directos.
          </p>
        )}
      </div>

      {data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {data.configured ? 'Sem issues unresolved recentes.' : 'Sem lista — configure o token.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Issue</th>
                <th className="px-3 py-2 font-medium">Count</th>
                <th className="px-3 py-2 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((issue) => (
                <tr key={issue.id} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2">
                    {issue.permalink ? (
                      <a
                        href={issue.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-brand hover:underline"
                      >
                        {issue.shortId ? `${issue.shortId}: ` : ''}
                        {issue.title}
                      </a>
                    ) : (
                      <span className="font-medium">{issue.title}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{issue.count}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {issue.lastSeen ? new Date(issue.lastSeen).toLocaleString('pt-PT') : '—'}
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
