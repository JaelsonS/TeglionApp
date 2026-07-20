import { useMemo, useState, type ChangeEvent } from 'react'
import { EyeOff, RotateCcw, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  KIND_META,
  humanizeActivityDescription,
  humanizeActivityTitle,
  resolveHideableActivityId,
} from '@/features/firm/client-hub/ClientHubHistory'
import { resolveActivityNav } from '@/features/firm/client-hub/clientHubActivityLinks'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { Skeleton } from '@/shared/design-system'
import {
  useClientActivityHistory,
  useHideAllClientFeedActivity,
  useHideClientActivity,
  useUnhideClientActivity,
} from '@/shared/hooks/queries/useClientHub'
import { formatDateTime } from '@/shared/utils/date'
import { cn } from '@/shared/lib/utils'

const KIND_FILTERS: Array<{ id: string; label: string }> = [
  { id: '', label: 'Tudo' },
  { id: 'message', label: 'Mensagens' },
  { id: 'document', label: 'Documentos' },
  { id: 'task', label: 'Tarefas' },
  { id: 'obligation', label: 'Obrigações' },
  { id: 'profile', label: 'Perfil' },
  { id: 'alert', label: 'Alertas' },
  { id: 'activity', label: 'Outros' },
]

const HIDDEN_FILTERS: Array<{ id: 'all' | 'visible' | 'hidden'; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'visible', label: 'No feed' },
  { id: 'hidden', label: 'Ocultas' },
]

type Props = {
  clientId: string
  onOpenProfile?: () => void
}

export function ClientHubActivityHistoryPanel({ clientId, onOpenProfile }: Props) {
  const navigate = useNavigate()
  const [kind, setKind] = useState('')
  const [hidden, setHidden] = useState<'all' | 'visible' | 'hidden'>('all')
  const [q, setQ] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [confirmHideAll, setConfirmHideAll] = useState(false)

  const filters = useMemo(
    () => ({
      kind: kind || undefined,
      hidden,
      q: q.trim() || undefined,
      from: from || undefined,
      to: to || undefined,
      page: 1,
      limit: 50,
    }),
    [kind, hidden, q, from, to],
  )

  const historyQuery = useClientActivityHistory(clientId, filters, true)
  const hideMutation = useHideClientActivity(clientId)
  const unhideMutation = useUnhideClientActivity(clientId)
  const hideAllMutation = useHideAllClientFeedActivity(clientId)

  const items = historyQuery.data?.items || []

  return (
    <section className="cb-client-hub-panel space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Histórico completo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tudo o que aconteceu nesta empresa — filtrável e recuperável. Ocultar limpa o feed, não apaga.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => setConfirmHideAll(true)}
          disabled={hideAllMutation.isPending}
        >
          <EyeOff className="mr-1.5 h-3.5 w-3.5" />
          Limpar feed
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {KIND_FILTERS.map((f) => (
            <button
              key={f.id || 'all'}
              type="button"
              onClick={() => setKind(f.id)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition',
                kind === f.id
                  ? 'bg-brand text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {HIDDEN_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setHidden(f.id)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition',
                hidden === f.id
                  ? 'bg-foreground text-background'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
              placeholder="Pesquisar título ou descrição…"
              className="pl-8"
            />
          </div>
          <Input
            type="date"
            value={from}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)}
            aria-label="De"
          />
          <Input
            type="date"
            value={to}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
            aria-label="Até"
          />
        </div>
      </div>

      {historyQuery.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/15 px-6 py-10 text-center text-sm text-muted-foreground">
          Nenhum registo com estes filtros.
        </div>
      ) : (
        <ul className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/60 bg-card">
          {items.map((item) => {
            const meta = KIND_META[item.kind] || KIND_META.activity
            const Icon = meta.icon
            const title = humanizeActivityTitle(item)
            const desc = humanizeActivityDescription(item)
            const activityId = resolveHideableActivityId(item)
            const isHidden = Boolean(item.hiddenFromFeed)
            const target = resolveActivityNav(clientId, item)

            return (
              <li
                key={item.id}
                className={cn(
                  'flex flex-wrap items-start gap-3 px-3 py-3 sm:px-4',
                  isHidden && 'bg-muted/20',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    meta.className,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  disabled={!target}
                  onClick={() => {
                    if (!target) return
                    if (target.type === 'href') navigate(target.href)
                    else onOpenProfile?.()
                  }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <time className="text-xs text-muted-foreground">{formatDateTime(item.at)}</time>
                  </div>
                  <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                    {meta.verb}
                    {isHidden ? ' · oculto do feed' : ''}
                  </p>
                  {desc ? <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p> : null}
                </button>
                {activityId ? (
                  isHidden ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      disabled={unhideMutation.isPending}
                      onClick={() => unhideMutation.mutate(activityId)}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      No feed
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      disabled={hideMutation.isPending}
                      onClick={() => hideMutation.mutate(activityId)}
                    >
                      <EyeOff className="mr-1 h-3.5 w-3.5" />
                      Ocultar
                    </Button>
                  )
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      {historyQuery.data && historyQuery.data.total > items.length ? (
        <p className="text-xs text-muted-foreground">
          A mostrar {items.length} de {historyQuery.data.total} registos.
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmHideAll}
        onOpenChange={setConfirmHideAll}
        title="Limpar o feed de Actividade?"
        description="Todas as entradas visíveis passam para o Histórico (ocultas). Pode restaurá-las uma a uma."
        confirmLabel="Limpar feed"
        testId="client-hub-hide-all-activity"
        onConfirm={async () => {
          await hideAllMutation.mutateAsync()
          setConfirmHideAll(false)
        }}
      />
    </section>
  )
}
