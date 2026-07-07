import { useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { firmSettingsApi } from '@/infrastructure/api/contabil/firmSettings'
import type { FirmSettingsBundle } from '@/shared/types/firmSettings'
import { authFirmLoginUrl } from '@/shared/constants/authPaths'
import { getErrorMessage } from '@/shared/utils/errors'
import { useAuth } from '@/shared/hooks/useAuth'

type Props = {
  bundle: FirmSettingsBundle
}

export function FirmSettingsDangerZone({ bundle }: Props) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [closing, setClosing] = useState(false)

  if (!bundle.capabilities.canCloseAccount) return null

  const firmName = bundle.firm.name

  const onConfirmClose = async () => {
    setClosing(true)
    try {
      await firmSettingsApi.closeAccount(confirmName.trim())
      setOpen(false)
      toast.success('Conta encerrada. A redireccionar…')
      await logout()
      navigate(authFirmLoginUrl(), { replace: true })
    } catch (err) {
      toast.error('Não foi possível encerrar a conta', { description: getErrorMessage(err) })
    } finally {
      setClosing(false)
    }
  }

  return (
    <section id="zona-perigo" className="cb-settings-panel cb-settings-panel--danger scroll-mt-24">
      <div className="cb-settings-panel-hd">
        <span className="cb-settings-panel-icon cb-settings-panel-icon--danger">
          <AlertTriangle className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="cb-settings-panel-title text-destructive">Zona de perigo</h2>
          <p className="cb-settings-panel-sub">
            Encerrar a conta desactiva o escritório e todas as sessões. Os dados permanecem arquivados conforme a
            política de privacidade — contacte o suporte para pedidos de eliminação definitiva.
          </p>
        </div>
      </div>

      <Button type="button" variant="destructive" className="rounded-lg" onClick={() => setOpen(true)}>
        Encerrar conta do escritório
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setConfirmName('')
        }}
        title="Confirmar encerramento"
        description={`Esta acção é irreversível para o acesso diário. Para confirmar, escreva o nome exacto do escritório: ${firmName}`}
        confirmLabel={closing ? 'A encerrar…' : 'Encerrar definitivamente'}
        testId="firm-close-account"
        onConfirm={onConfirmClose}
      >
        <div className="space-y-2">
          <Label htmlFor="confirm-firm-name">Nome do escritório</Label>
          <Input
            id="confirm-firm-name"
            value={confirmName}
            onChange={(e: FormChangeEvent) => setConfirmName(e.target.value)}
            placeholder={firmName}
            disabled={closing}
            autoComplete="off"
          />
        </div>
      </ConfirmDialog>
    </section>
  )
}
