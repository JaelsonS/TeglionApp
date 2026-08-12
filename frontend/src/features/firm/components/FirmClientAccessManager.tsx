import { useState, type FocusEvent } from 'react'
import { KeyRound, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { contabilClientsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { copyTextToClipboard } from '@/shared/utils/clipboard'

type PortalAccessStatus = 'NO_ACCESS' | 'PENDING_INVITE' | 'ACTIVE' | 'REVOKED'

/**
 * Gestão de acesso ao portal para clientes que já tiveram acesso (ACTIVE) ou
 * cujo acesso foi revogado (REVOKED). Para NO_ACCESS/PENDING_INVITE, o fluxo
 * de convite individual existente (`FirmClientInviteButton`) continua a ser
 * usado sem alterações.
 *
 * Revogar nunca apaga o cliente nem qualquer dado associado — só bloqueia o
 * acesso e corta sessões activas. Reemitir gera um novo link independente do
 * anterior, preservando o mesmo cliente e todo o seu histórico.
 */
export function FirmClientAccessManager({
  clientId,
  portalAccessStatus,
  onChanged,
  size = 'sm',
}: {
  clientId: string
  portalAccessStatus?: PortalAccessStatus
  onChanged?: () => void
  size?: 'sm' | 'default'
}) {
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')

  async function copyUrl(url: string) {
    const ok = await copyTextToClipboard(url)
    if (ok) toast.success('Link copiado', { description: url, duration: 6000 })
    else toast.warning('Copie o link manualmente', { description: url, duration: 12000 })
  }

  const handleRevoke = async () => {
    setLoading(true)
    try {
      await contabilClientsApi.revokeAccess(clientId)
      toast.success('Acesso revogado. Os dados do cliente foram mantidos.')
      setRevokeOpen(false)
      onChanged?.()
    } catch (err) {
      toast.error('Não foi possível revogar o acesso', { description: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  const handleReissue = async () => {
    setLoading(true)
    try {
      const res = await contabilClientsApi.resendInvite(clientId)
      setInviteUrl(res.inviteUrl)
      setInviteDialogOpen(true)
      await copyUrl(res.inviteUrl)
      onChanged?.()
    } catch (err) {
      toast.error('Não foi possível gerar o novo convite', { description: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  if (portalAccessStatus === 'ACTIVE') {
    return (
      <>
        <Button
          type="button"
          size={size}
          variant="outline"
          className="rounded-full gap-1.5"
          onClick={() => setRevokeOpen(true)}
        >
          <ShieldOff className="h-3.5 w-3.5" />
          Gerir acesso
        </Button>
        <ConfirmDialog
          open={revokeOpen}
          onOpenChange={setRevokeOpen}
          testId="firm-client-revoke-access"
          title="Revogar acesso ao Teglion?"
          description="Este cliente perderá o acesso atual ao Teglion. Os dados, documentos, histórico, agendamentos, mensagens e demais informações permanecerão preservados. Pode gerar um novo convite a qualquer momento."
          confirmLabel="Revogar acesso"
          onConfirm={handleRevoke}
        />
      </>
    )
  }

  if (portalAccessStatus === 'REVOKED') {
    return (
      <>
        <Button
          type="button"
          size={size}
          variant="outline"
          className="rounded-full gap-1.5"
          disabled={loading}
          onClick={() => void handleReissue()}
        >
          <KeyRound className="h-3.5 w-3.5" />
          {loading ? '…' : 'Gerar novo convite'}
        </Button>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent className="rounded-2xl sm:max-w-lg" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Novo convite gerado</DialogTitle>
              <DialogDescription>
                O link anterior deixou de funcionar. Este é o novo link de acesso do cliente — o histórico dele foi
                mantido.
              </DialogDescription>
            </DialogHeader>
            <Input
              readOnly
              value={inviteUrl}
              className="font-mono text-xs"
              onFocus={(e: FocusEvent<HTMLInputElement>) => e.target.select()}
            />
            <DialogFooter>
              <Button type="button" onClick={() => void copyUrl(inviteUrl)}>
                Copiar link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return null
}
