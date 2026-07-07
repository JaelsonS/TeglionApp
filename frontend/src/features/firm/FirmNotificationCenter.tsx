import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { firmNotificationsApi } from '@/infrastructure/api/contabil/tasks'
import { useLiveEventsContext } from '@/shared/providers/LiveEventsProvider'
import { Button } from '@/shared/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { cn } from '@/shared/lib/utils'

const CATEGORY_LABEL: Record<string, string> = {
  TASK: 'Tarefa',
  MESSAGE: 'Mensagem',
  ALERT: 'Alerta',
  DOCUMENT: 'Documento',
  DEADLINE: 'Prazo',
  SYSTEM: 'Sistema',
}

export function FirmNotificationCenter({ variant = 'default' }: { variant?: 'default' | 'topbar' }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const liveBadge = useLiveEventsContext().badge?.notifications ?? 0

  const { data, isLoading } = useQuery({
    queryKey: ['firm-notifications'],
    queryFn: () => firmNotificationsApi.list({ limit: 40 }),
    enabled: open,
    staleTime: 45_000,
  })

  const markAll = useMutation({
    mutationFn: () => firmNotificationsApi.markAllRead(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['firm-notifications'] }),
  })

  const markOne = useMutation({
    mutationFn: (id: string) => firmNotificationsApi.markRead(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['firm-notifications'] }),
  })

  const items = data?.items ?? []
  const unread = open
    ? data?.unreadCount ?? items.filter((n) => !n.readAt).length
    : liveBadge

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'relative',
          variant === 'topbar' ? 'cb-firm-topbar-icon-btn' : 'h-10 w-10 rounded-full',
        )}
        aria-label="Notificações"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span
            className={cn(
              variant === 'topbar'
                ? 'absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card'
                : 'cb-badge-count absolute -right-0.5 -top-0.5 min-w-4',
            )}
            aria-hidden={variant === 'topbar'}
          >
            {variant === 'topbar' ? null : unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-md">
          <div className="cb-sheet-body">
          <SheetHeader className="shrink-0 border-b border-border/60 px-5 py-4 text-left">
            <div className="flex items-center justify-between gap-2 pr-8">
              <SheetTitle className="text-base">Notificações</SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending || unread === 0}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar lidas
              </Button>
            </div>
          </SheetHeader>

          <ul className="cb-sheet-scroll">
            {isLoading ? (
              <li className="px-5 py-12 text-center text-sm text-muted-foreground">A carregar…</li>
            ) : items.length === 0 ? (
              <li className="px-5 py-12 text-center text-sm text-muted-foreground">Sem notificações</li>
            ) : (
              items.map((n) => (
                <li key={n.id} className="border-b border-border/40 last:border-0">
                  <button
                    type="button"
                    className={cn(
                      'w-full px-5 py-3.5 text-left text-sm transition-colors hover:bg-muted/50',
                      !n.readAt && 'bg-brand/[0.04]',
                    )}
                    onClick={() => {
                      if (!n.readAt) markOne.mutate(n.id)
                      if (n.actionUrl) setOpen(false)
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-foreground">{n.title}</span>
                      <span className="shrink-0 text-caption font-medium uppercase text-muted-foreground">
                        {CATEGORY_LABEL[n.category] || n.category}
                      </span>
                    </div>
                    {n.body ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body}</p> : null}
                    {n.actionUrl ? (
                      <Link
                        to={n.actionUrl}
                        className="mt-2 inline-flex text-xs font-medium text-brand"
                        onClick={() => setOpen(false)}
                      >
                        Abrir
                      </Link>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
