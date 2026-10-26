import { Building2, Loader2 } from 'lucide-react'
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
  yearMonth: string
  onYearMonthChange: (value: string) => void
  activeLeaseCount: number
  generating: boolean
  onGenerate: () => void
}

export function GenerateRentReceiptsDialog({
  open,
  onOpenChange,
  yearMonth,
  onYearMonthChange,
  activeLeaseCount,
  generating,
  onGenerate,
}: Props) {
  const canGenerate = activeLeaseCount > 0 && !generating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="space-y-2 border-b border-border/60 px-5 py-4 text-left">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Building2 className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <DialogTitle>Gerar recibos do mês</DialogTitle>
              <DialogDescription className="mt-1">
                Cria rascunhos internos para contratos activos. Quem já tem o mês fica de fora.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          <div
            className={`rounded-xl border px-3 py-2.5 text-sm ${
              activeLeaseCount > 0
                ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                : 'border-amber-200 bg-amber-50 text-amber-950'
            }`}
          >
            {activeLeaseCount > 0 ? (
              <>
                <strong>{activeLeaseCount}</strong> contrato
                {activeLeaseCount === 1 ? '' : 's'} activo
                {activeLeaseCount === 1 ? '' : 's'} elegível
                {activeLeaseCount === 1 ? '' : 'is'}.
              </>
            ) : (
              <>Ainda sem contratos activos. Crie um imóvel e um contrato primeiro.</>
            )}
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Mês a gerar</span>
            <Input
              type="month"
              value={yearMonth}
              onChange={(e: FormChangeEvent) => onYearMonthChange(e.target.value)}
              disabled={generating}
            />
          </label>

          <p className="text-xs leading-relaxed text-muted-foreground">
            São recibos internos do gabinete — não substituem o Portal das Finanças nem comunicação à
            AT.
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
              'Gerar rascunhos'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
