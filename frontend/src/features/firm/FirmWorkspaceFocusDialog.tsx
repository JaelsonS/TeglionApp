import type { ReactNode } from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { cn } from '@/shared/lib/utils'

/** Painel grande centrado — obrigações, tarefas (sem split lateral). */
export function FirmWorkspaceFocusDialog({
  open,
  onOpenChange,
  title,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex h-[min(92dvh,920px)] max-h-[min(92dvh,920px)] w-[min(96vw,960px)] max-w-[min(96vw,960px)] flex-col gap-0 overflow-hidden p-0',
          className,
        )}
      >
        <DialogHeader className="shrink-0 border-b border-border/60 px-4 py-3 text-left">
          <DialogTitle className="truncate text-base font-semibold pr-8">{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
