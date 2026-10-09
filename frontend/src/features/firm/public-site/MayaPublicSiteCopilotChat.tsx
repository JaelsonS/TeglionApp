import { useMemo, useRef, useState } from 'react'
import { Loader2, MessageCircle, Send } from 'lucide-react'
import { toast } from 'sonner'

import { mayaSetupApi } from '@/infrastructure/api/contabil/mayaSetup'
import { searchMayaIntents } from '@/features/maya/searchMayaIntents'
import { openMaya } from '@/features/maya/openMaya'
import { Button } from '@/shared/components/ui/button'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

type ChatMessage = {
  id: string
  role: 'user' | 'maya'
  text: string
  intentId?: string
}

const QUICK_PROMPTS = [
  'Como publico a página?',
  'Onde enquadro a imagem do destaque?',
  'Links legais no rodapé?',
  'Diferença entre rascunho e publicado?',
]

type Props = {
  setupStep: string
  countryCode: 'PT' | 'BR'
  aiAdviseEnabled: boolean
}

export function MayaPublicSiteCopilotChat({ setupStep, countryCode, aiAdviseEnabled }: Props) {
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'maya',
      text: 'Olá — sou a Maya. Pergunte como configurar a página pública, imagens, serviços ou publicação. Respondo com guias do produto; se tiver add-on IA, também posso esclarecer dúvidas curtas (não envio dados de clientes).',
    },
  ])
  const listRef = useRef<HTMLDivElement>(null)

  const canAskAi = aiAdviseEnabled

  async function send(raw?: string) {
    const question = (raw ?? input).trim()
    if (!question || busy) return
    setInput('')
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: question }
    setMessages((prev) => [...prev, userMsg])
    setBusy(true)
    try {
      const matches = searchMayaIntents(question, 2)
      if (matches.length) {
        const top = matches[0]
        const extra = matches[1] ? `\n\nTambém relevante: «${matches[1].title}».` : ''
        setMessages((prev) => [
          ...prev,
          {
            id: `m-${Date.now()}-guide`,
            role: 'maya',
            text: `${top.answer}\n\nPróximo passo: ${top.steps?.[0] || 'Revise o preview.'}${extra}`,
            intentId: top.id,
          },
        ])
      } else if (canAskAi) {
        const { answer } = await mayaSetupApi.advise(question, {
          setupStep,
          countryCode,
        })
        setMessages((prev) => [...prev, { id: `m-${Date.now()}-ai`, role: 'maya', text: answer }])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `m-${Date.now()}-fallback`,
            role: 'maya',
            text: 'Não encontrei um guia exacto. Abra a Maya (botão flutuante) ou use o passo a passo à direita. O add-on IA permite respostas personalizadas aqui no chat.',
          },
        ])
      }

      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
      })
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const hint = useMemo(
    () =>
      canAskAi
        ? 'Guia incluído + respostas IA curtas (não substituem aconselhamento fiscal).'
        : 'Guia incluído — respostas IA requerem add-on «ai» ou piloto.',
    [canAskAi],
  )

  return (
    <aside
      className="flex max-h-[min(520px,70vh)] flex-col rounded-xl border border-border/60 bg-card shadow-sm"
      data-testid="maya-public-site-copilot-chat"
      aria-label="Conversa com a Maya"
    >
      <div className="border-b border-border/50 px-3 py-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <MessageCircle className="h-4 w-4 text-brand" aria-hidden />
          Pergunte à Maya
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{hint}</p>
      </div>

      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              'rounded-lg px-2.5 py-2 text-[13px] leading-relaxed',
              m.role === 'user' ? 'ml-6 bg-brand/10 text-foreground' : 'mr-4 bg-muted/40 text-foreground',
            )}
          >
            <p className="whitespace-pre-wrap">{m.text}</p>
            {m.intentId ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="mt-1 h-auto p-0 text-xs"
                onClick={() => openMaya(m.intentId)}
              >
                Abrir guia completo
              </Button>
            ) : null}
          </div>
        ))}
        {busy ? (
          <p className="flex items-center gap-2 text-caption text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            A pensar…
          </p>
        ) : null}
      </div>

      <div className="border-t border-border/50 px-3 py-2">
        <div className="mb-2 flex flex-wrap gap-1">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              className="rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/60"
              onClick={() => void send(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
        >
          <input
            className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            placeholder="Ex.: Preciso de ajuda com a política de privacidade?"
            value={input}
            maxLength={500}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <Button type="submit" size="sm" disabled={busy || !input.trim()} aria-label="Enviar pergunta">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </aside>
  )
}
