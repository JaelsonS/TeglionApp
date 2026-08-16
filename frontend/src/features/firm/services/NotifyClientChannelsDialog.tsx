import { useEffect, useState } from 'react'
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

export type NotifyChannel = 'email' | 'sms' | 'whatsapp'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  hasEmail: boolean
  hasPhone: boolean
  confirmLabel?: string
  allowSaveWithoutNotify?: boolean
  loading?: boolean
  onConfirm: (channels: NotifyChannel[]) => void | Promise<void>
}

export function NotifyClientChannelsDialog({
  open,
  onOpenChange,
  title,
  description,
  hasEmail,
  hasPhone,
  confirmLabel = 'Notificar',
  allowSaveWithoutNotify = false,
  loading = false,
  onConfirm,
}: Props) {
  const [channels, setChannels] = useState<NotifyChannel[]>([])

  useEffect(() => {
    if (!open) return
    const initial: NotifyChannel[] = []
    if (hasEmail) initial.push('email')
    setChannels(initial)
  }, [open, hasEmail])

  const toggle = (ch: NotifyChannel) => {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]))
  }

  const options: Array<{ id: NotifyChannel; label: string; hint: string; enabled: boolean }> = [
    { id: 'email', label: 'Email', hint: hasEmail ? 'Via Brevo' : 'Sem email no contacto', enabled: hasEmail },
    {
      id: 'sms',
      label: 'SMS',
      hint: hasPhone ? 'Texto curto transacional (Brevo)' : 'Sem telemóvel no contacto',
      enabled: hasPhone,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      hint: hasPhone ? 'Abre o WhatsApp com mensagem pronta (sem custo API)' : 'Sem telemóvel no contacto',
      enabled: hasPhone,
    },
  ]

  const canSend = (allowSaveWithoutNotify || channels.length > 0) && !loading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
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
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {allowSaveWithoutNotify ? (
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              disabled={loading}
              onClick={() => void onConfirm([])}
            >
              Só guardar
            </Button>
          ) : null}
          <Button type="button" variant="outline" className="rounded-full" disabled={loading} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={!canSend || (!allowSaveWithoutNotify && channels.length === 0)}
            onClick={() => void onConfirm(channels)}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A enviar…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
