import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Circle, Loader2, Send, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { TurnstileField, type TurnstileFieldHandle } from '@/shared/components/security/TurnstileField'
import { contabilPublicApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { assertTurnstileToken } from '@/shared/security/withTurnstileToken'
import { isTurnstileEnabled, TURNSTILE_ACTIONS } from '@/shared/security/turnstile'
import type { IntakeChecklistItem } from '@/infrastructure/api/contabil/public'
import type { FormChangeEvent } from '@/shared/types/react-events'

type PortalTokens = {
  upload: string
  reply: string
}

function DocumentRow({
  item,
  token,
  turnstileToken,
  onUploaded,
  onTurnstileConsumed,
}: {
  item: IntakeChecklistItem
  token: string
  turnstileToken: string
  onUploaded: () => void
  onTurnstileConsumed: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const turnstileOk = !isTurnstileEnabled() || Boolean(turnstileToken)

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !item.tag) return
    setUploading(true)
    try {
      const ts = assertTurnstileToken(turnstileToken)
      await contabilPublicApi.uploadIntakeDocument(token, item.tag, file, ts)
      toast.success(`"${item.title}" enviado`)
      onTurnstileConsumed()
      onUploaded()
    } catch (err) {
      onTurnstileConsumed()
      toast.error('Erro ao enviar ficheiro', { description: getErrorMessage(err) })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" className="hidden" onChange={(e) => void onFileChange(e)} />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0 rounded-full"
        disabled={uploading || !turnstileOk}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
        Enviar
      </Button>
    </>
  )
}

function QuestionRow({
  item,
  token,
  turnstileToken,
  onAnswered,
  onTurnstileConsumed,
}: {
  item: IntakeChecklistItem
  token: string
  turnstileToken: string
  onAnswered: () => void
  onTurnstileConsumed: () => void
}) {
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const turnstileOk = !isTurnstileEnabled() || Boolean(turnstileToken)

  const onSend = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      const ts = assertTurnstileToken(turnstileToken)
      await contabilPublicApi.submitIntakeReply(token, item.id, reply.trim(), ts)
      toast.success('Resposta enviada')
      onTurnstileConsumed()
      onAnswered()
    } catch (err) {
      onTurnstileConsumed()
      toast.error('Erro ao enviar resposta', { description: getErrorMessage(err) })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <Input
        className="h-9 flex-1 rounded-md text-sm"
        placeholder="A sua resposta…"
        value={reply}
        onChange={(e: FormChangeEvent) => setReply(e.target.value)}
      />
      <Button
        type="button"
        size="sm"
        className="shrink-0 rounded-full"
        disabled={sending || !reply.trim() || !turnstileOk}
        onClick={() => void onSend()}
      >
        {sending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
        Enviar
      </Button>
    </div>
  )
}

function ChecklistRow({
  item,
  token,
  tokens,
  onChanged,
  onUploadTurnstileConsumed,
  onReplyTurnstileConsumed,
}: {
  item: IntakeChecklistItem
  token: string
  tokens: PortalTokens
  onChanged: () => void
  onUploadTurnstileConsumed: () => void
  onReplyTurnstileConsumed: () => void
}) {
  return (
    <li className="rounded-lg border border-border/40 p-3">
      <div className="flex items-center gap-3">
        {item.received ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{item.title}</p>
          {item.instructions ? <p className="text-xs text-muted-foreground">{item.instructions}</p> : null}
        </div>
        {item.received ? (
          <span className="shrink-0 text-xs font-semibold text-emerald-700">
            {item.kind === 'document' ? 'Recebido' : 'Respondido'}
          </span>
        ) : item.kind === 'document' ? (
          <DocumentRow
            item={item}
            token={token}
            turnstileToken={tokens.upload}
            onUploaded={onChanged}
            onTurnstileConsumed={onUploadTurnstileConsumed}
          />
        ) : null}
      </div>
      {item.kind === 'question' && item.received && item.textReply ? (
        <p className="ml-8 mt-2 rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">{item.textReply}</p>
      ) : null}
      {item.kind === 'question' && !item.received ? (
        <QuestionRow
          item={item}
          token={token}
          turnstileToken={tokens.reply}
          onAnswered={onChanged}
          onTurnstileConsumed={onReplyTurnstileConsumed}
        />
      ) : null}
    </li>
  )
}

export function ServiceIntakePortalPage() {
  const { token } = useParams<{ token: string }>()
  const queryClient = useQueryClient()
  const [tokens, setTokens] = useState<PortalTokens>({ upload: '', reply: '' })
  const uploadTsRef = useRef<TurnstileFieldHandle | null>(null)
  const replyTsRef = useRef<TurnstileFieldHandle | null>(null)

  const query = useQuery({
    queryKey: ['public-intake-checklist', token],
    queryFn: () => contabilPublicApi.getIntakeByToken(token!),
    enabled: Boolean(token),
    retry: false,
  })

  const refetch = () => void queryClient.invalidateQueries({ queryKey: ['public-intake-checklist', token] })

  const resetUploadTurnstile = () => {
    uploadTsRef.current?.reset()
    setTokens((prev) => ({ ...prev, upload: '' }))
  }

  const resetReplyTurnstile = () => {
    replyTsRef.current?.reset()
    setTokens((prev) => ({ ...prev, reply: '' }))
  }

  if (query.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-center text-sm text-muted-foreground">
          Este link não é válido. Verifique o email que recebeu ou contacte o escritório.
        </p>
      </div>
    )
  }

  const { serviceName, checklist } = query.data
  const allReceived = checklist.length > 0 && checklist.every((c) => c.received)
  const pendingDocs = checklist.some((c) => c.kind === 'document' && !c.received)
  const pendingQuestions = checklist.some((c) => c.kind === 'question' && !c.received)

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 py-10">
      <header className="mb-6 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {serviceName || 'O seu pedido'}
        </p>
        <h1 className="text-2xl font-bold">Documentos necessários</h1>
      </header>

      <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        {pendingDocs || pendingQuestions ? (
          <div className="mb-4 space-y-3 rounded-lg border border-border/40 bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Complete a verificação abaixo antes de enviar documentos ou respostas.
            </p>
            {pendingDocs ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Verificação (envio de documentos)</p>
                <TurnstileField
                  action={TURNSTILE_ACTIONS.PORTAL_UPLOAD}
                  fieldRef={uploadTsRef}
                  onTokenChange={(t) => setTokens((prev) => ({ ...prev, upload: t }))}
                />
              </div>
            ) : null}
            {pendingQuestions ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Verificação (respostas)</p>
                <TurnstileField
                  action={TURNSTILE_ACTIONS.PORTAL_REPLY}
                  fieldRef={replyTsRef}
                  onTokenChange={(t) => setTokens((prev) => ({ ...prev, reply: t }))}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {checklist.length === 0 ? (
          <p className="text-sm text-muted-foreground">Não há documentos pendentes para este pedido.</p>
        ) : (
          <ul className="space-y-2">
            {checklist.map((item) => (
              <ChecklistRow
                key={item.id}
                item={item}
                token={token!}
                tokens={tokens}
                onChanged={refetch}
                onUploadTurnstileConsumed={resetUploadTurnstile}
                onReplyTurnstileConsumed={resetReplyTurnstile}
              />
            ))}
          </ul>
        )}

        {allReceived ? (
          <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-800">
            Todos os documentos foram recebidos — a equipa foi notificada.
          </p>
        ) : null}
      </div>
    </div>
  )
}
