import { useState, type FocusEvent } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Copy, Link2, Share2 } from 'lucide-react'
import { toast } from 'sonner'

import { contabilPt as t } from '@/shared/i18n/contabilPt'
import { Button } from '@/shared/components/ui/button'
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
import { Label } from '@/shared/components/ui/label'

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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')

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
    setLoading(true)
    try {
      const res = await contabilClientsApi.createInvite({
        clientId,
        email: email || undefined,
      })
      const url = res.inviteUrl
      setInviteUrl(url)
      setDialogOpen(true)
      await copyUrl(url)
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
        onClick={() => void handleInvite()}
      >
        <Link2 className="h-3.5 w-3.5" />
        {loading ? '…' : t.firm.inviteLink}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t.firm.inviteDialogTitle}</DialogTitle>
            <DialogDescription>{t.firm.inviteDialogHint}</DialogDescription>
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
