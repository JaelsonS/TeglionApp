/**
 * ConfirmDialog.tsx
 * 
 * Modal de confirmação (delete/ações destrutivas).
 */

import React from 'react'
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

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  testId,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => Promise<void>
  testId: string
  children?: React.ReactNode
}) {
  const { t } = useTranslation('common')
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        data-testid={testId}
        className="w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto rounded-2xl"
      >
        <AlertDialogHeader>
          <AlertDialogTitle data-testid={`${testId}-title`}>{title}</AlertDialogTitle>
          <AlertDialogDescription data-testid={`${testId}-description`}>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children ? <div className="mt-4">{children}</div> : null}
        <AlertDialogFooter>
          <AlertDialogCancel data-testid={`${testId}-cancel-button`}>
            {t('dialogs.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid={`${testId}-confirm-button`}
            onClick={async (e: React.MouseEvent) => {
              e.preventDefault()
              await onConfirm()
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
