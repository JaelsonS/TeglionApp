import { useEffect, useId, useState } from 'react'
import { ArrowLeft, ExternalLink, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'
import { SheetHiddenTitle } from '@/shared/components/ui/sheet-hidden-title'
import { Chip } from '@/shared/design-system/Chip'
import { SafeImage } from '@/shared/components/ui/SafeImage'
import { useAuth } from '@/shared/hooks/useAuth'
import { cn } from '@/shared/lib/utils'
import { getMayaIntent, MAYA_INTENTS } from '@/features/maya/mayaContent'
import { MAYA_OPEN_EVENT, type MayaOpenDetail } from '@/features/maya/openMaya'

type MayaAssistantProps = {
  className?: string
}

/**
 * Maya v1 — assistente guiada.
 * Sem LLM · sem APIs de negócio · sem acesso a documentos/clientes/tokens.
 * Telemetria: não envia payloads (apenas navegação local).
 */
export function MayaAssistant({ className }: MayaAssistantProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [activeIntentId, setActiveIntentId] = useState<string | null>(null)

  const firstName = String(user?.fullName || '')
    .trim()
    .split(/\s+/)[0]
  const active = activeIntentId ? getMayaIntent(activeIntentId) : null

  useEffect(() => {
    function onOpen(ev: Event) {
      const detail = (ev as CustomEvent<MayaOpenDetail>).detail
      setOpen(true)
      setActiveIntentId(detail?.intentId || null)
    }
    window.addEventListener(MAYA_OPEN_EVENT, onOpen as EventListener)
    return () => window.removeEventListener(MAYA_OPEN_EVENT, onOpen as EventListener)
  }, [])

  if (!user || user.role === 'CLIENT') return null

  function close() {
    setOpen(false)
    setActiveIntentId(null)
  }

  function openIntent(id: string) {
    setActiveIntentId(id)
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          'fixed z-40 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full',
          'border border-brand/20 bg-card shadow-[var(--cb-shadow-elevated)]',
          'transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2',
          /* Mobile (<768): acima da bottom nav + safe area */
          'bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-[max(1rem,env(safe-area-inset-right,0px))]',
          /* Tablet + desktop (≥768): canto inferior — sem bottom nav */
          'md:bottom-6 md:right-6',
          className,
        )}
        aria-label="Abrir Maya, assistente virtual do Teglion"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Maya — assistente Teglion"
        onClick={() => setOpen(true)}
      >
        <SafeImage src="/maya/maya-avatar-sm.png" alt="" className="h-full w-full object-cover" />
      </button>

      <Sheet
        open={open}
        onOpenChange={(next: boolean) => {
          setOpen(next)
          if (!next) setActiveIntentId(null)
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
          aria-labelledby={titleId}
        >
          <SheetHiddenTitle>Maya — assistente Teglion</SheetHiddenTitle>
          <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
            {active ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Voltar às opções"
                onClick={() => setActiveIntentId(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <SafeImage
                src="/maya/maya-avatar-sm.png"
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p id={titleId} className="text-sm font-semibold text-foreground">
                Maya
              </p>
              <p className="text-caption text-muted-foreground">
                {active ? active.title : 'Assistente Teglion'}
              </p>
            </div>
            <Button type="button" size="icon" variant="ghost" aria-label="Fechar Maya" onClick={close}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {!active ? (
              <>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm leading-relaxed text-foreground">
                  <p>
                    Olá{firstName ? `, ${firstName}` : ''}! Eu sou a Maya, a assistente virtual do Teglion.
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    Estou aqui para o ajudar a perceber e configurar o Teglion.
                  </p>
                  <p className="mt-2 text-caption text-muted-foreground">
                    Na minha versão actual não tenho acesso aos seus documentos nem aos dados privados do
                    escritório.
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Por onde quer começar?</p>
                  <div className="flex flex-wrap gap-2">
                    {MAYA_INTENTS.map((intent) => (
                      <Chip key={intent.id} onClick={() => openIntent(intent.id)}>
                        {intent.title}
                      </Chip>
                    ))}
                  </div>
                </div>

                <p className="text-caption text-muted-foreground">
                  A ajuda contextual de cada módulo continua no botão «Guia».
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-card p-4 shadow-[var(--cb-shadow-card)]">
                  <p className="text-sm leading-relaxed text-foreground">{active.answer}</p>
                  {active.steps.length ? (
                    <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-muted-foreground">
                      {active.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  ) : null}
                </div>

                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    close()
                    navigate(active.deepLink)
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Ir para {active.shortDescription}
                </Button>

                {active.relatedIntents.length ? (
                  <div>
                    <p className="mb-2 text-caption font-medium text-muted-foreground">Também pode interessar</p>
                    <div className="flex flex-wrap gap-2">
                      {active.relatedIntents.map((rid) => {
                        const related = getMayaIntent(rid)
                        if (!related) return null
                        return (
                          <Chip key={rid} onClick={() => openIntent(rid)}>
                            {related.title}
                          </Chip>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
