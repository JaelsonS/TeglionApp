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
    data.projectUrl ? { href: data.projectUrl, label: 'Abrir projecto no Sentry' } : null,
    data.issuesUrl ? { href: data.issuesUrl, label: 'Abrir todas as issues' } : null,
  ].filter(Boolean) as Array<{ href: string; label: string }>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Sentry</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O Sentry já monitoriza a app. Este ecrã é um atalho — não substitui a consola Sentry.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Captura de erros (DSN)
          </p>
          <p className="mt-2 text-lg font-semibold">
            {data.dsnConfigured || data.capturingOk ? 'Activa' : 'Em falta'}
          </p>
          <p className="mt-1 text-muted-foreground">
            {data.statusMessage ||
              'Com DSN no Render, os erros da API já chegam ao Sentry. Isto é o que importa para defesa.'}
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Lista neste painel (API token)
          </p>
          <p className="mt-2 text-lg font-semibold">
            {data.listingOk || data.configured ? 'Activa' : 'Opcional — em falta'}
          </p>
          <p className="mt-1 text-muted-foreground">
            Coisa diferente do DSN: um token Auth do Sentry para puxar a tabela de issues para aqui.
            Sem token, usa os botões abaixo e abre o Sentry directamente.
          </p>
        </div>
      </div>

      {data.hint ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          <p className="font-medium">Porque não há tabela de issues aqui?</p>
          <p className="mt-1">{data.hint}</p>
          <p className="mt-2 text-xs opacity-90">
            Render staging (opcional):{' '}
            <code className="rounded bg-muted px-1">SENTRY_ORG_SLUG=jaelson-santos</code>{' '}
            <code className="rounded bg-muted px-1">SENTRY_PROJECT_SLUG=teglion-staging</code>{' '}
            <code className="rounded bg-muted px-1">SENTRY_AUTH_TOKEN=…</code>{' '}
            <code className="rounded bg-muted px-1">SENTRY_REGION_URL=https://de.sentry.io</code>
          </p>
        </div>
      ) : null}

      {links.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              {l.label} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          ))}
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Projecto: {data.org || '—'}/{data.project || '—'}
        {data.regionBase ? ` · API ${data.regionBase}` : ''}
      </p>

      {data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {data.configured || data.listingOk
            ? 'Sem issues unresolved recentes neste projecto.'
            : 'Sem lista embutida — abre o Sentry pelos botões. A captura por DSN continua a funcionar.'}
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
