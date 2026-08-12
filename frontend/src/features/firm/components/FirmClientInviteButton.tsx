import { useState, type FocusEvent } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Copy, Link2, Share2 } from 'lucide-react'
import { toast } from 'sonner'

import { contabilPt as t } from '@/shared/i18n/contabilPt'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { contabilClientsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { copyTextToClipboard } from '@/shared/utils/clipboard'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { PasswordInput } from '@/shared/components/ui/password-input'
import { Label } from '@/shared/components/ui/label'
import { PASSWORD_MIN_LENGTH } from '@/shared/utils/passwordPolicy'

export function FirmClientInviteButton({
  clientId,
  email,
  size = 'sm',
}: {
  clientId: string
  email?: string | null
  size?: 'sm' | 'default'
}) {
  const [loading, setLoading] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const [activatedWithPassword, setActivatedWithPassword] = useState(false)
  const [setPasswordNow, setSetPasswordNow] = useState(false)
  const [initialPassword, setInitialPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function copyUrl(url: string) {
    const ok = await copyTextToClipboard(url)
    if (ok) {
      toast.success(t.firm.inviteCopied, { description: url, duration: 6000 })
    } else {
      toast.warning(t.firm.inviteCopyManual, {
        description: url,
        duration: 12000,
      })
    }
  }

  async function shareUrl(url: string) {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: t.firm.inviteShareTitle,
          text: t.firm.inviteShareBody,
          url,
        })
        return
      }
    } catch {
      /* User cancelled ou indisponível */
    }
    void copyUrl(url)
  }

  const handleInvite = async () => {
    if (setPasswordNow) {
      if (initialPassword.length < PASSWORD_MIN_LENGTH) {
        toast.error(`A palavra-passe deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`)
        return
      }
      if (initialPassword !== confirmPassword) {
        toast.error('As palavras-passe não coincidem.')
        return
      }
    }

    setLoading(true)
    try {
      const res = await contabilClientsApi.createInvite({
        clientId,
        email: email || undefined,
        initialPassword: setPasswordNow ? initialPassword : undefined,
      })
      const url = res.inviteUrl
      setInviteUrl(url)
      setActivatedWithPassword(Boolean(res.activatedWithPassword))
      setSetupOpen(false)
      setResultOpen(true)
      await copyUrl(url)
      if (res.activatedWithPassword) {
        toast.success('Acesso criado', {
          description: 'O cliente já pode entrar com o e-mail e a palavra-passe definidos.',
        })
      }
    } catch (err) {
      toast.error(t.firm.inviteError, { description: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        size={size}
        variant="outline"
        className="rounded-full gap-1.5"
        disabled={loading}
        onClick={() => {
          setSetPasswordNow(false)
          setInitialPassword('')
          setConfirmPassword('')
          setSetupOpen(true)
        }}
      >
        <Link2 className="h-3.5 w-3.5" />
        {loading ? '…' : t.firm.inviteLink}
      </Button>

      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar acesso ao portal</DialogTitle>
            <DialogDescription>
              O cliente só consegue entrar depois de ter palavra-passe. Pode enviar um link para ele definir a
              senha, ou definir uma palavra-passe inicial agora.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={setPasswordNow}
                onCheckedChange={(v: boolean | 'indeterminate') => setSetPasswordNow(v === true)}
                className="mt-0.5"
              />
              <span>
                Definir palavra-passe inicial agora
                <span className="mt-0.5 block text-caption text-muted-foreground">
                  O cliente entra de imediato com o e-mail e esta palavra-passe (mín. {PASSWORD_MIN_LENGTH}{' '}
                  caracteres, com maiúscula, minúscula e número).
                </span>
              </span>
            </label>

            {setPasswordNow ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Palavra-passe</span>
                  <PasswordInput
                    value={initialPassword}
                    onChange={(e: FormChangeEvent) => setInitialPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Confirmar</span>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e: FormChangeEvent) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </label>
              </div>
            ) : (
              <p className="rounded-lg bg-muted/40 px-3 py-2 text-caption text-muted-foreground">
                Será gerado um link de convite. O cliente tem de abrir o link, criar a palavra-passe e só depois
                consegue fazer login. Se tentar entrar antes, aparece «ainda não tem palavra-passe».
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSetupOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={loading} onClick={() => void handleInvite()}>
              {loading ? 'A criar…' : setPasswordNow ? 'Criar acesso' : 'Gerar link de convite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {activatedWithPassword ? 'Acesso criado' : t.firm.inviteDialogTitle}
            </DialogTitle>
            <DialogDescription>
              {activatedWithPassword
                ? 'Partilhe o link de login e a palavra-passe com o cliente. Ele já pode entrar no portal.'
                : t.firm.inviteDialogHint}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`invite-url-${clientId}`} className="sr-only">
              URL
            </Label>
            <Input
              id={`invite-url-${clientId}`}
              readOnly
              value={inviteUrl}
              className="font-mono text-xs"
              onFocus={(e: FocusEvent<HTMLInputElement>) => e.target.select()}
            />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-full gap-1.5" onClick={() => void shareUrl(inviteUrl)}>
              <Share2 className="h-4 w-4" />
              {t.firm.inviteShare}
            </Button>
            <Button type="button" className="rounded-full gap-1.5" onClick={() => void copyUrl(inviteUrl)}>
              <Copy className="h-4 w-4" />
              {t.firm.inviteCopyAgain}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
