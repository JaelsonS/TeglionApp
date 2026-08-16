/**
 * ConfirmDialog — confirmação bonita (substitui window.confirm nativo).
 * Variante destructive para apagar / revogar / acções irreversíveis.
 */

import React, { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { cn } from '@/shared/lib/utils'

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  testId = 'confirm-dialog',
  variant = 'default',
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  testId?: string
  variant?: 'default' | 'destructive'
  children?: React.ReactNode
}) {
  const { t } = useTranslation('common')
  const [busy, setBusy] = useState(false)
  const destructive = variant === 'destructive'

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (busy) return
        onOpenChange(next)
      }}
    >
      <AlertDialogContent
        data-testid={testId}
        className="w-[calc(100vw-2rem)] max-w-md max-h-[85vh] gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-xl"
      >
        <AlertDialogHeader className="space-y-3 px-6 pb-2 pt-6 text-left sm:text-left">
          <div className="flex items-start gap-3">
            {destructive ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" aria-hidden />
              </span>
            ) : null}
            <div className="min-w-0 space-y-1.5">
              <AlertDialogTitle data-testid={`${testId}-title`} className="text-lg leading-snug">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription
                data-testid={`${testId}-description`}
                className="text-sm leading-relaxed text-muted-foreground"
              >
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {children ? <div className="px-6 pb-2">{children}</div> : null}

        <AlertDialogFooter className="border-t border-border/50 bg-muted/30 px-6 py-4 sm:space-x-2">
          <AlertDialogCancel
            data-testid={`${testId}-cancel-button`}
            disabled={busy}
            className="rounded-full"
          >
            {cancelLabel || t('dialogs.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid={`${testId}-confirm-button`}
            disabled={busy}
            className={cn(
              'rounded-full',
              destructive && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            )}
            onClick={async (e: React.MouseEvent) => {
              e.preventDefault()
              setBusy(true)
              try {
                await onConfirm()
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A processar…
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
