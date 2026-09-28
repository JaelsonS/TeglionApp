import type { MouseEvent } from 'react'

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

export type RecurrenceRemoveScope = 'occurrence' | 'series'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityLabel: string
  periodLabel?: string
  scope: RecurrenceRemoveScope
  onScopeChange: (scope: RecurrenceRemoveScope) => void
  onConfirm: () => void
  pending?: boolean
}

export function RecurrenceRemoveDialog({
  open,
  onOpenChange,
  entityLabel,
  periodLabel,
  scope,
  onScopeChange,
  onConfirm,
  pending,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover {entityLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta entrada faz parte de uma série recorrente
            {periodLabel ? ` (${periodLabel})` : ''}. Escolha o que pretende remover.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 py-2">
          {(
            [
              {
                id: 'occurrence' as const,
                title: 'Só este mês / esta ocorrência',
                hint: 'Os meses seguintes podem voltar a aparecer conforme a recorrência.',
              },
              {
                id: 'series' as const,
                title: 'Toda a série (meses futuros)',
                hint: 'Desactiva a recorrência — deixa de gerar novas ocorrências.',
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={cn(
                'rounded-xl border p-3 text-left transition',
                scope === opt.id ? 'border-brand bg-brand/5 ring-1 ring-brand/30' : 'border-border/70 hover:bg-muted/30',
              )}
              onClick={() => onScopeChange(opt.id)}
            >
              <span className="block text-sm font-medium text-foreground">{opt.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{opt.hint}</span>
            </button>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e: MouseEvent) => {
              e.preventDefault()
              onConfirm()
            }}
          >
            {pending ? 'A remover…' : 'Remover'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
