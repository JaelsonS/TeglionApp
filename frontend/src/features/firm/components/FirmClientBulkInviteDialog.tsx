import { useEffect, useState, type ChangeEvent } from 'react'
import { CheckCircle2, Eye, Loader2, Mail, XCircle } from 'lucide-react'
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
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { contabilClientsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'

type BulkInviteResult = {
  requested: number
  sent: number
  alreadyActive: number
  skippedNoEmail: number
  failed: number
  pending?: number
}

type Step = 'compose' | 'result'

/**
 * Convite em massa — modal central com mensagem editável, pré-visualização e
 * envio de teste antes de disparar pela Brevo (transaccional, em lotes).
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
  const [step, setStep] = useState<Step>('compose')
  const [sending, setSending] = useState(false)
  const [testing, setTesting] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [result, setResult] = useState<BulkInviteResult | null>(null)
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [testEmail, setTestEmail] = useState('')

  useEffect(() => {
    if (!open) return
    setStep('compose')
    setResult(null)
    setShowPreview(false)
    setLoadingPreview(true)
    void contabilClientsApi
      .previewInviteEmail()
      .then((preview) => {
        setSubject(preview.subject || '')
        setBodyHtml(preview.bodyHtml || '')
        setBodyText(preview.bodyText || '')
      })
      .catch(() => {
        /* preview soft-fail — o escritório ainda pode escrever o texto */
      })
      .finally(() => setLoadingPreview(false))
  }, [open])

  const reset = () => {
    setSending(false)
    setTesting(false)
    setResult(null)
    setStep('compose')
    setShowPreview(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSend = async () => {
    setSending(true)
    try {
      const res = await contabilClientsApi.createBulkInvite(clientIds, {
        subject: subject.trim() || undefined,
        bodyHtml: bodyHtml.trim() || undefined,
        bodyText: bodyText.trim() || undefined,
      })
      setResult(res)
      setStep('result')
      if (res.sent > 0) onDone?.()
    } catch (err) {
      toast.error('Não foi possível enviar os convites', { description: getErrorMessage(err) })
      handleOpenChange(false)
    } finally {
      setSending(false)
    }
  }

  const handleTest = async () => {
    if (!testEmail.trim()) {
      toast.error('Indique o e-mail de teste')
      return
    }
    setTesting(true)
    try {
      await contabilClientsApi.sendTestInviteEmail({
        toEmail: testEmail.trim(),
        subject: subject.trim() || undefined,
        bodyHtml: bodyHtml.trim() || undefined,
        bodyText: bodyText.trim() || undefined,
      })
      toast.success('E-mail de teste enviado')
    } catch (err) {
      toast.error('Falha no e-mail de teste', { description: getErrorMessage(err) })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0">
        {step === 'result' && result ? (
          <>
            <DialogHeader className="border-b border-border/60 px-5 py-4 text-left">
              <DialogTitle>Convites processados</DialogTitle>
              <DialogDescription>
                Resultado do envio para os {result.requested} clientes seleccionados.
              </DialogDescription>
            </DialogHeader>
            <ul className="space-y-2 px-5 py-4 text-sm">
              <li className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Enviados
                </span>
                <span className="font-semibold">{result.sent}</span>
              </li>
              <li className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-sky-600" /> Já tinham acesso
                </span>
                <span className="font-semibold">{result.alreadyActive}</span>
              </li>
              {result.skippedNoEmail > 0 ? (
                <li className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-amber-600" /> Sem e-mail
                  </span>
                  <span className="font-semibold">{result.skippedNoEmail}</span>
                </li>
              ) : null}
              {result.failed > 0 ? (
                <li className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-rose-600" /> Falharam
                  </span>
                  <span className="font-semibold">{result.failed}</span>
                </li>
              ) : null}
            </ul>
            <DialogFooter className="border-t border-border/60 px-5 py-3">
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="border-b border-border/60 px-5 py-4 text-left">
              <DialogTitle>Enviar convites</DialogTitle>
              <DialogDescription>
                Está prestes a enviar convites para <strong>{clientIds.length}</strong> cliente
                {clientIds.length === 1 ? '' : 's'}. O texto abaixo é uma sugestão automática do Teglion —
                pode adaptar à identidade do escritório.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {loadingPreview ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> A preparar mensagem…
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="bulk-invite-subject">Assunto</Label>
                    <Input
                      id="bulk-invite-subject"
                      value={subject}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bulk-invite-body">Mensagem (HTML simples)</Label>
                    <Textarea
                      id="bulk-invite-body"
                      rows={10}
                      value={bodyHtml}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBodyHtml(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                    <div className="min-w-[12rem] flex-1 space-y-1.5">
                      <Label htmlFor="bulk-invite-test">E-mail de teste</Label>
                      <Input
                        id="bulk-invite-test"
                        type="email"
                        placeholder="seu@email.com"
                        value={testEmail}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setTestEmail(e.target.value)}
                      />
                    </div>
                    <Button type="button" variant="outline" size="sm" disabled={testing} onClick={() => void handleTest()}>
                      {testing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Mail className="mr-1.5 h-3.5 w-3.5" />}
                      Enviar teste
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview((v) => !v)}>
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      {showPreview ? 'Esconder preview' : 'Pré-visualizar'}
                    </Button>
                  </div>
                  {showPreview ? (
                    <div
                      className="rounded-xl border border-border/60 bg-card p-4 text-sm"
                      dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    />
                  ) : null}
                  <p className="text-caption text-muted-foreground">
                    Os envios usam a Brevo em modo transaccional, em lotes com pausa entre mensagens, para proteger a
                    reputação do domínio. A interface espera o resultado deste lote (adequado a dezenas de clientes).
                  </p>
                </>
              )}
            </div>

            <DialogFooter className="border-t border-border/60 px-5 py-3">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" disabled={sending || loadingPreview || clientIds.length === 0} onClick={() => void handleSend()}>
                {sending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> A enviar…
                  </>
                ) : (
                  `Enviar convites (${clientIds.length})`
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
