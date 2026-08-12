import { useState } from 'react'
import { CheckCircle2, Loader2, Mail, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { contabilClientsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'

type BulkInviteResult = {
  requested: number
  sent: number
  alreadyActive: number
  skippedNoEmail: number
  failed: number
}

/**
 * Convite em massa — gera e envia convites de acesso ao portal para vários
 * clientes seleccionados de uma vez. Componente paralelo ao
 * `FirmClientInviteButton` (convite individual), não o substitui.
 */
export function FirmClientBulkInviteDialog({
  open,
  onOpenChange,
  clientIds,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientIds: string[]
  onDone?: () => void
}) {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<BulkInviteResult | null>(null)

  const reset = () => {
    setSending(false)
    setResult(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSend = async () => {
    setSending(true)
    try {
      const res = await contabilClientsApi.createBulkInvite(clientIds)
      setResult(res)
      if (res.sent > 0) {
        onDone?.()
      }
    } catch (err) {
      toast.error('Não foi possível enviar os convites', { description: getErrorMessage(err) })
      handleOpenChange(false)
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md" aria-describedby={undefined}>
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>Convites processados</DialogTitle>
              <DialogDescription>Resultado do envio para os {result.requested} clientes seleccionados.</DialogDescription>
            </DialogHeader>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Enviados
                </span>
                <span className="font-semibold">{result.sent}</span>
              </li>
              <li className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-sky-600" /> Já tinham acesso
                </span>
                <span className="font-semibold">{result.alreadyActive}</span>
              </li>
              {result.skippedNoEmail > 0 ? (
                <li className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="flex items-center gap-2 text-foreground">
                    <Mail className="h-4 w-4 text-amber-600" /> Sem e-mail registado
                  </span>
                  <span className="font-semibold">{result.skippedNoEmail}</span>
                </li>
              ) : null}
              {result.failed > 0 ? (
                <li className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="flex items-center gap-2 text-foreground">
                    <XCircle className="h-4 w-4 text-destructive" /> Falharam
                  </span>
                  <span className="font-semibold">{result.failed}</span>
                </li>
              ) : null}
            </ul>
            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Enviar convite para {clientIds.length} clientes</DialogTitle>
              <DialogDescription>
                Cada cliente recebe um link individual por e-mail para criar o acesso ao portal. Clientes que já têm acesso
                activo não recebem um novo convite.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={sending}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void handleSend()} disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> A enviar…
                  </>
                ) : (
                  'Enviar convites'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
