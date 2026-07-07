import { useState } from 'react'
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
import { Label } from '@/shared/components/ui/label'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestTitle?: string
  onConfirm: (amountCents: number) => void
  loading?: boolean
}

export function ServiceQuoteDialog({ open, onOpenChange, requestTitle, onConfirm, loading }: Props) {
  const [eur, setEur] = useState('500.00')

  const handleConfirm = () => {
    const normalized = eur.replace(',', '.').trim()
    const value = Number(normalized)
    if (!Number.isFinite(value) || value <= 0) return
    onConfirm(Math.round(value * 100))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Orçamentar serviço</DialogTitle>
          <DialogDescription>
            {requestTitle ? `Defina o valor para «${requestTitle}».` : 'Indique o valor do orçamento em euros.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="quote-eur">Valor (EUR)</Label>
          <Input
            id="quote-eur"
            type="text"
            inputMode="decimal"
            value={eur}
            onChange={(e: FormChangeEvent) => setEur(e.target.value)}
            placeholder="500.00"
            className="rounded-lg"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" className="cb-services-btn-primary" disabled={loading} onClick={handleConfirm}>
            Guardar orçamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
