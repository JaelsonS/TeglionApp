import { Bell } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

import { useClientPortalBellCount } from '@/shared/hooks/useClientPortalBellCount'
import { clientPortalContabilApi } from '@/infrastructure/api'
import { broadcastQueryKeys } from '@/shared/hooks/queries/useBroadcasts'
import { emitAppDataChanged } from '@/shared/utils/appEvents'
import { cn } from '@/shared/lib/utils'
import { formatDateTime } from '@/shared/utils/date'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet'
import { Button } from '@/shared/components/ui/button'

import type { PortalNotification } from '@/shared/types/portal'

function resolveNotificationRoute(n: PortalNotification) {
  if (n.actionUrl && n.actionUrl.startsWith('/app/client')) return n.actionUrl
  const entity = String(n.entityType || '').toUpperCase()
  const type = String(n.type || '').toUpperCase()
  if (entity === 'MESSAGE' || type === 'MESSAGE') return '/app/client/messages'
  if (entity === 'DOCUMENT' || type.includes('DOCUMENT')) return '/app/client/documents'
  if (entity === 'OBLIGATION' || type.includes('OBLIGATION')) return '/app/client/agenda'
  if (entity === 'CLIENT_TASK' || type.includes('TASK') || type.includes('REQUEST')) return '/app/client/requests'
  return '/app/client'
}

export function ClientNotificationCenter() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { unreadAlerts, unreadNotifs, unreadNews, total, notifications: items } =
    useClientPortalBellCount()

  const markReadMut = useMutation({
    mutationFn: (id: string) => clientPortalContabilApi.markNotificationRead(id),
    onSuccess: (_data, id) => {
      qc.setQueryData(
        ['contabil', 'notifications', 'portal'],
        (old: { items?: PortalNotification[] } | undefined) => {
          if (!old?.items) return old
          return {
            items: old.items.map((n) =>
              n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
            ),
          }
        },
      )
      void qc.invalidateQueries({ queryKey: ['contabil', 'notifications', 'portal'] })
      void qc.invalidateQueries({ queryKey: broadcastQueryKeys.clientFeed('bell') })
      void qc.invalidateQueries({ queryKey: ['client', 'news', 'feed'] })
      emitAppDataChanged({ scope: 'live' })
    },
  })

  const markAllMut = useMutation({
    mutationFn: () => clientPortalContabilApi.markAllNotificationsRead(),
    onSuccess: () => {
      qc.setQueryData(
        ['contabil', 'notifications', 'portal'],
        (old: { items?: PortalNotification[] } | undefined) => {
          if (!old?.items) return old
          const now = new Date().toISOString()
          return { items: old.items.map((n) => ({ ...n, readAt: n.readAt || now })) }
        },
      )
      void qc.invalidateQueries({ queryKey: ['contabil', 'notifications', 'portal'] })
      void qc.invalidateQueries({ queryKey: broadcastQueryKeys.clientFeed('bell') })
      void qc.invalidateQueries({ queryKey: ['client', 'news', 'feed'] })
      emitAppDataChanged({ scope: 'live' })
    },
  })

  async function openNotification(n: PortalNotification) {
    if (!n.readAt) {
      await markReadMut.mutateAsync(n.id)
    }
    navigate(resolveNotificationRoute(n))
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notificações">
          <Bell className="h-5 w-5" />
          {total > 0 ? (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-caption font-bold text-white"
              data-testid="client-notification-badge"
            >
              {total > 9 ? '9+' : total}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="cb-sheet-body flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notificações</SheetTitle>
        </SheetHeader>
        <div className="cb-sheet-scroll mt-4 flex flex-col gap-4">
          {unreadAlerts > 0 ? (
            <Link
              to="/app/client/alerts"
              className="block rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
              onClick={() => {
                void qc.invalidateQueries({ queryKey: broadcastQueryKeys.clientFeed('bell') })
                emitAppDataChanged({ scope: 'live' })
              }}
            >
              {unreadAlerts} alerta{unreadAlerts > 1 ? 's' : ''} por ler →
            </Link>
          ) : null}

          {unreadNews > 0 ? (
            <Link
              to="/app/client/news"
              className="block rounded-xl border border-brand/20 bg-brand/[0.04] px-4 py-3 text-sm font-medium text-foreground"
              onClick={() => {
                void qc.invalidateQueries({ queryKey: ['client', 'news', 'feed'] })
                emitAppDataChanged({ scope: 'live' })
              }}
            >
              {unreadNews} notícia{unreadNews > 1 ? 's' : ''} por ler →
            </Link>
          ) : null}

          {items.length === 0 && unreadAlerts === 0 && unreadNews === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem notificações novas.</p>
          ) : (
            <ul className="space-y-2">
              {items.slice(0, 20).map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={cn(
                      'w-full rounded-xl border px-3 py-2.5 text-left text-sm transition',
                      n.readAt
                        ? 'border-border/40 text-muted-foreground'
                        : 'border-brand/20 bg-brand/[0.04] font-medium text-foreground hover:bg-brand/[0.08]',
                    )}
                    onClick={() => void openNotification(n)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span>{n.title}</span>
                      {n.createdAt ? (
                        <span className="shrink-0 text-[11px] font-normal text-muted-foreground">
                          {formatDateTime(n.createdAt)}
                        </span>
                      ) : null}
                    </div>
                    {n.body ? <p className="mt-0.5 line-clamp-2 text-xs font-normal text-muted-foreground">{n.body}</p> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto flex flex-col gap-2 pt-2">
            {unreadNotifs > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full"
                disabled={markAllMut.isPending}
                onClick={() => markAllMut.mutate()}
              >
                Marcar todas como lidas
              </Button>
            ) : null}
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link to="/app/client">Ver início</Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
