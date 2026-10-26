import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { cn } from '@/shared/lib/utils'
import type { NotifyChannel } from '@/features/firm/services/NotifyClientChannelsDialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentScheduledAt: string | null | undefined
  hasEmail: boolean
  hasPhone: boolean
  loading?: boolean
  onConfirm: (payload: { scheduledAt: string; notifyChannels: NotifyChannel[] }) => void | Promise<void>
}

function toLocalInputValue(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function RescheduleConsultationDialog({
  open,
  onOpenChange,
  currentScheduledAt,
  hasEmail,
  hasPhone,
  loading = false,
  onConfirm,
}: Props) {
  const [localWhen, setLocalWhen] = useState('')
  const [channels, setChannels] = useState<NotifyChannel[]>([])

  useEffect(() => {
    if (!open) return
    setLocalWhen(toLocalInputValue(currentScheduledAt))
    const initial: NotifyChannel[] = []
    if (hasEmail) initial.push('email')
    setChannels(initial)
  }, [open, currentScheduledAt, hasEmail])

  const scheduledAtIso = useMemo(() => {
    if (!localWhen) return null
    const ms = new Date(localWhen).getTime()
    return Number.isFinite(ms) ? new Date(ms).toISOString() : null
  }, [localWhen])

  const toggle = (ch: NotifyChannel) => {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]))
  }

  const options: Array<{ id: NotifyChannel; label: string; hint: string; enabled: boolean }> = [
    { id: 'email', label: 'Email', hint: hasEmail ? 'Avisar por email' : 'Sem email no contacto', enabled: hasEmail },
    {
      id: 'sms',
      label: 'SMS',
      hint: hasPhone ? 'Avisar por SMS' : 'Sem telemóvel no contacto',
      enabled: hasPhone,
    },
  ]

  const canSave = Boolean(scheduledAtIso) && !loading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reagendar consulta</DialogTitle>
          <DialogDescription>
            Escolha a nova data e hora. Pode avisar o cliente por email e/ou SMS, ou só alterar o horário
            sem notificar.
          </DialogDescription>
        </DialogHeader>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Nova data e hora</span>
          <input
            type="datetime-local"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={localWhen}
            disabled={loading}
            onChange={(e) => setLocalWhen(e.target.value)}
          />
        </label>

        <div className="space-y-2 py-1">
          <p className="text-xs font-medium text-muted-foreground">Notificar o cliente</p>
          {options.map((opt) => {
            const on = channels.includes(opt.id)
            return (
              <button
                key={opt.id}
                type="button"
                disabled={!opt.enabled || loading}
                onClick={() => toggle(opt.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors',
                  on ? 'border-brand/40 bg-brand/5' : 'border-border/60 bg-card',
                  !opt.enabled && 'cursor-not-allowed opacity-50',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                    on ? 'border-brand bg-brand text-primary-foreground' : 'border-muted-foreground/40',
                  )}
                  aria-hidden
                >
                  {on ? '✓' : null}
                </span>
                <span className="min-w-0">
                  <span className="font-medium text-foreground">{opt.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{opt.hint}</span>
                </span>
              </button>
            )
          })}
          <p className="text-xs text-muted-foreground">
            Sem canais seleccionados, o horário muda só na agenda — o cliente não recebe aviso.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-full" disabled={loading} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="rounded-full"
            disabled={!canSave}
            onClick={() => {
              if (!scheduledAtIso) return
              void onConfirm({ scheduledAt: scheduledAtIso, notifyChannels: [] })
            }}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Reagendar sem notificar
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={!canSave || channels.length === 0}
            onClick={() => {
              if (!scheduledAtIso) return
              void onConfirm({ scheduledAt: scheduledAtIso, notifyChannels: channels })
            }}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Reagendar e notificar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
