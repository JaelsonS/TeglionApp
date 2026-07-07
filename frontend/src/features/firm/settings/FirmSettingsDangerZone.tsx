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
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [npsReason, setNpsReason] = useState('')
  const [npsComment, setNpsComment] = useState('')
  const [closing, setClosing] = useState(false)

  if (!bundle.capabilities.canCloseAccount) return null

  const firmName = bundle.firm.name

  const onConfirmClose = async () => {
    if (npsScore == null) {
      toast.error('Indique o NPS antes de encerrar a conta.')
      return
    }
    setClosing(true)
    try {
      await firmSettingsApi.closeAccount({
        confirmName: confirmName.trim(),
        npsScore,
        npsReason: npsReason.trim() || null,
        npsComment: npsComment.trim() || null,
      })
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
          if (!v) {
            setConfirmName('')
            setNpsScore(null)
            setNpsReason('')
            setNpsComment('')
          }
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

        <div className="space-y-2">
          <Label>NPS: de 0 a 10, qual a probabilidade de recomendar o Teglion?</Label>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
            {Array.from({ length: 11 }, (_, idx) => idx).map((score) => (
              <Button
                key={score}
                type="button"
                size="sm"
                variant={npsScore === score ? 'default' : 'outline'}
                onClick={() => setNpsScore(score)}
                disabled={closing}
                className="h-9 px-0"
              >
                {score}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nps-reason">Principal motivo (opcional)</Label>
          <Input
            id="nps-reason"
            value={npsReason}
            onChange={(e: FormChangeEvent) => setNpsReason(e.target.value)}
            placeholder="Ex.: preço, funcionalidades, experiência da equipa"
            disabled={closing}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nps-comment">Como podemos melhorar? (opcional)</Label>
          <textarea
            id="nps-comment"
            value={npsComment}
            onChange={(e) => setNpsComment(e.target.value)}
            placeholder="Partilhe o que faltou para a sua operação no dia a dia."
            disabled={closing}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </ConfirmDialog>
    </section>
  )
}
