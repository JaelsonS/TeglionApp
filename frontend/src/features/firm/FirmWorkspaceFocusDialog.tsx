import type { ReactNode } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { cn } from '@/shared/lib/utils'

/** Painel grande centrado — obrigações, tarefas e pré-visualizações (sem gaveta lateral). */
export function FirmWorkspaceFocusDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
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
          <DialogTitle className="pr-8 text-base font-semibold leading-snug">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="mt-1 pr-8 text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">Detalhe no centro do ecrã</DialogDescription>
          )}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
