import { Loader2, Wallet } from 'lucide-react'
import type { FormChangeEvent } from '@/shared/types/react-events'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  fromYearMonth: string
  toYearMonth: string
  onFromYearMonthChange: (value: string) => void
  onToYearMonthChange: (value: string) => void
  activeRetainerCount: number
  generating: boolean
  onGenerate: () => void
}

export function GenerateMonthDialog({
  open,
  onOpenChange,
  fromYearMonth,
  toYearMonth,
  onFromYearMonthChange,
  onToYearMonthChange,
  activeRetainerCount,
  generating,
  onGenerate,
}: Props) {
  const canGenerate = activeRetainerCount > 0 && !generating && Boolean(fromYearMonth) && Boolean(toYearMonth)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="space-y-2 border-b border-border/60 px-5 py-4 text-left">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Wallet className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <DialogTitle>Gerar / replicar avenças</DialogTitle>
              <DialogDescription className="mt-1">
                Cria rascunhos para todos os clientes com avença activa no intervalo escolhido (ex.
                Jan–Dez). Quem já tem o mês, ou está fora do início/fim da avença, fica de fora.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          <div
            className={`rounded-xl border px-3 py-2.5 text-sm ${
              activeRetainerCount > 0
                ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                : 'border-amber-200 bg-amber-50 text-amber-950'
            }`}
          >
            {activeRetainerCount > 0 ? (
              <>
                <strong>{activeRetainerCount}</strong> cliente
                {activeRetainerCount === 1 ? '' : 's'} com avença activa
                {activeRetainerCount === 1 ? ' será incluído' : ' serão incluídos'}.
              </>
            ) : (
              <>
                Nenhum cliente com avença activa. Abra um cliente, defina o valor mensal, active a
                avença e guarde — ou use «+» numa célula do mapa.
              </>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">De</span>
              <Input
                type="month"
                value={fromYearMonth}
                onChange={(e: FormChangeEvent) => onFromYearMonthChange(e.target.value)}
                disabled={generating}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Até</span>
              <Input
                type="month"
                value={toYearMonth}
                onChange={(e: FormChangeEvent) => onToYearMonthChange(e.target.value)}
                disabled={generating}
              />
            </label>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Para um só mês, escolha o mesmo valor em «De» e «Até». Os rascunhos ficam editáveis no
            mapa.
          </p>
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/20 px-5 py-3 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generating}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={onGenerate} disabled={!canGenerate}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A gerar…
              </>
            ) : (
              'Gerar / replicar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
