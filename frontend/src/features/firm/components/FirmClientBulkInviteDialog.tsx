import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { AlertTriangle, CheckCircle2, Eye, Loader2, Mail, XCircle } from 'lucide-react'
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
import { hasValidClientEmail } from '@/shared/utils/clientEmail'

type BulkInviteResult = {
  requested: number
  sent: number
  alreadyActive: number
  skippedNoEmail: number
  failed: number
  pending?: number
}

type Step = 'compose' | 'result'

export type BulkInviteClientSummary = {
  id: string
  name: string
  email?: string | null
}

/**
 * Convite em massa — modal com texto de modelo editável (sem HTML),
 * pré-visualização e envio de teste antes de disparar pela Brevo.
 */
export function FirmClientBulkInviteDialog({
  open,
  onOpenChange,
  clientIds,
  clients = [],
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientIds: string[]
  /** Dados dos seleccionados para avisar sem e-mail antes do envio. */
  clients?: BulkInviteClientSummary[]
  onDone?: () => void
}) {
  const [step, setStep] = useState<Step>('compose')
  const [sending, setSending] = useState(false)
  const [testing, setTesting] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [result, setResult] = useState<BulkInviteResult | null>(null)
  const [subject, setSubject] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [testEmail, setTestEmail] = useState('')

  const selectedClients = useMemo(() => {
    if (clients.length) {
      const byId = new Map(clients.map((c) => [c.id, c]))
      return clientIds.map((id) => byId.get(id) || { id, name: id, email: null })
    }
    return clientIds.map((id) => ({ id, name: id, email: null as string | null }))
  }, [clientIds, clients])

  const withoutEmail = useMemo(
    () => selectedClients.filter((c) => !hasValidClientEmail(c.email)),
    [selectedClients],
  )
  const withEmailCount = selectedClients.length - withoutEmail.length
  const canSend = withEmailCount > 0

  useEffect(() => {
    if (!open) return
    setStep('compose')
    setResult(null)
    setShowPreview(true)
    setLoadingPreview(true)
    void contabilClientsApi
      .previewInviteEmail()
      .then((preview) => {
        setSubject(preview.subject || '')
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
    setShowPreview(true)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSend = async () => {
    if (!canSend) {
      toast.error('Nenhum cliente com e-mail válido', {
        description: 'Complete o e-mail na ficha de cada empresa antes de enviar convites.',
      })
      return
    }
    setSending(true)
    try {
      const eligibleIds = selectedClients.filter((c) => hasValidClientEmail(c.email)).map((c) => c.id)
      const res = await contabilClientsApi.createBulkInvite(eligibleIds, {
        subject: subject.trim() || undefined,
        bodyText: bodyText.trim() || undefined,
      })
      setResult({
        ...res,
        // Inclui os que já sabíamos que não tinham e-mail (não enviados ao API).
        skippedNoEmail: (res.skippedNoEmail || 0) + withoutEmail.length,
        requested: clientIds.length,
      })
      setStep('result')
      if (res.sent > 0) onDone?.()
      else if (res.failed > 0) {
        toast.error('Convites criados, mas o e-mail falhou', {
          description: 'Verifique o remetente Brevo (FROM_EMAIL) e tente reenviar ou usar o e-mail de teste.',
        })
      }
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
                    <Mail className="h-4 w-4 text-amber-600" /> Sem e-mail válido
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
                Está prestes a enviar convites para <strong>{withEmailCount}</strong> cliente
                {withEmailCount === 1 ? '' : 's'} com e-mail válido
                {withoutEmail.length > 0 ? (
                  <>
                    {' '}
                    (<strong>{withoutEmail.length}</strong> sem e-mail serão ignorados).
                  </>
                ) : (
                  '.'
                )}{' '}
                O texto abaixo é o modelo do Teglion — pode editar se quiser; o e-mail é formatado automaticamente
                (sem código HTML).
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {withoutEmail.length > 0 ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
                  <p className="flex items-start gap-2 font-medium">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    Empresas sem e-mail válido no cadastro
                  </p>
                  <p className="mt-1 text-caption text-amber-900/90">
                    Complete o e-mail na ficha destas empresas antes de as incluir no envio. Não receberão
                    convite neste lote:
                  </p>
                  <ul className="mt-2 max-h-28 list-disc space-y-0.5 overflow-y-auto pl-5 text-caption">
                    {withoutEmail.slice(0, 20).map((c) => (
                      <li key={c.id}>{c.name}</li>
                    ))}
                    {withoutEmail.length > 20 ? <li>… e mais {withoutEmail.length - 20}</li> : null}
                  </ul>
                </div>
              ) : null}

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
                      disabled={!canSend}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bulk-invite-body">Mensagem</Label>
                    <Textarea
                      id="bulk-invite-body"
                      rows={12}
                      value={bodyText}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBodyText(e.target.value)}
                      className="text-sm leading-relaxed"
                      disabled={!canSend}
                    />
                    <p className="text-caption text-muted-foreground">
                      Texto simples — saudação, botão do convite e rodapé são acrescentados
                      automaticamente. Linha em branco = novo parágrafo.
                    </p>
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
                    <div className="rounded-xl border border-border/60 bg-card p-4 text-sm leading-relaxed whitespace-pre-wrap">
                      {bodyText.trim() || (
                        <span className="text-muted-foreground">A mensagem aparece aqui à medida que edita.</span>
                      )}
                    </div>
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
              <Button
                type="button"
                disabled={sending || loadingPreview || !canSend}
                onClick={() => void handleSend()}
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> A enviar…
                  </>
                ) : canSend ? (
                  `Enviar convites (${withEmailCount})`
                ) : (
                  'Sem e-mails válidos'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
