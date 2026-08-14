import { useEffect, useId, useState } from 'react'
import { ArrowLeft, ExternalLink, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Chip } from '@/shared/design-system/Chip'
import { SafeImage } from '@/shared/components/ui/SafeImage'
import { useAuth } from '@/shared/hooks/useAuth'
import { cn } from '@/shared/lib/utils'
import { getMayaIntent, MAYA_INTENTS } from '@/features/maya/mayaContent'
import { MAYA_OPEN_EVENT, type MayaOpenDetail } from '@/features/maya/openMaya'
import {
  isMayaFabVisible,
  MAYA_FAB_CHANGED_EVENT,
  setMayaFabVisible,
} from '@/features/maya/mayaFabPreference'

type MayaAssistantProps = {
  className?: string
}

/**
 * Maya v1 — assistente guiada (popup centrado, estilo conversação).
 * Sem LLM · sem APIs de negócio · sem acesso a documentos/clientes/tokens.
 */
export function MayaAssistant({ className }: MayaAssistantProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [activeIntentId, setActiveIntentId] = useState<string | null>(null)
  const [fabVisible, setFabVisible] = useState(true)

  const firstName = String(user?.fullName || '')
    .trim()
    .split(/\s+/)[0]
  const active = activeIntentId ? getMayaIntent(activeIntentId) : null

  useEffect(() => {
    setFabVisible(isMayaFabVisible())
    function onFabChanged(ev: Event) {
      const detail = (ev as CustomEvent<{ visible: boolean }>).detail
      if (typeof detail?.visible === 'boolean') setFabVisible(detail.visible)
      else setFabVisible(isMayaFabVisible())
    }
    window.addEventListener(MAYA_FAB_CHANGED_EVENT, onFabChanged as EventListener)
    return () => window.removeEventListener(MAYA_FAB_CHANGED_EVENT, onFabChanged as EventListener)
  }, [])

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

  function closeDialog() {
    setOpen(false)
    setActiveIntentId(null)
  }

  function hideFab() {
    setMayaFabVisible(false)
    setFabVisible(false)
  }

  function showFab() {
    setMayaFabVisible(true)
    setFabVisible(true)
  }

  function openIntent(id: string) {
    setActiveIntentId(id)
  }

  const fabPosition = cn(
    'fixed z-40',
    'bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-[max(1rem,env(safe-area-inset-right,0px))]',
    'md:bottom-6 md:right-6',
  )

  return (
    <>
      {fabVisible ? (
        <div className={cn(fabPosition, 'group', className)} data-testid="maya-fab">
          <button
            type="button"
            className={cn(
              'flex h-12 w-12 items-center justify-center overflow-hidden rounded-full',
              'border border-brand/25 bg-card shadow-[var(--cb-shadow-elevated)]',
              'ring-2 ring-brand/10',
              'transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2',
            )}
            aria-label="Abrir Maya, assistente virtual do Teglion"
            aria-haspopup="dialog"
            aria-expanded={open}
            title="Maya — assistente Teglion"
            onClick={() => setOpen(true)}
          >
            <SafeImage src="/maya/maya-avatar-sm.png" alt="" className="h-full w-full object-cover" />
          </button>
          <button
            type="button"
            className={cn(
              'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full',
              'border border-border/80 bg-card text-muted-foreground shadow-sm',
              'opacity-80 transition hover:opacity-100 hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            )}
            aria-label="Esconder Maya"
            title="Esconder Maya"
            data-testid="maya-fab-dismiss"
            onClick={(e) => {
              e.stopPropagation()
              hideFab()
            }}
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            fabPosition,
            'flex h-9 items-center gap-1 rounded-full border border-border/70 bg-card/95 px-2.5',
            'text-xs text-muted-foreground shadow-sm backdrop-blur-sm',
            'transition hover:border-brand/30 hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            className,
          )}
          aria-label="Mostrar Maya"
          title="Mostrar Maya"
          data-testid="maya-fab-restore"
          onClick={showFab}
        >
          <span className="font-bold text-brand" aria-hidden>
            ?
          </span>
          <SafeImage
            src="/maya/maya-avatar-sm.png"
            alt=""
            className="h-4 w-4 rounded-full object-cover opacity-90"
          />
        </button>
      )}

      <Dialog
        open={open}
        onOpenChange={(next: boolean) => {
          setOpen(next)
          if (!next) setActiveIntentId(null)
        }}
      >
        <DialogContent
          className={cn(
            'gap-0 overflow-hidden p-0 sm:max-w-md',
            'border-brand/20 shadow-[var(--cb-shadow-elevated)]',
          )}
          aria-labelledby={titleId}
        >
          <div className="relative overflow-hidden border-b border-brand/10 bg-gradient-to-br from-brand/[0.12] via-sky-500/[0.06] to-transparent px-5 pb-5 pt-6 pr-12">
            {active ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute left-3 top-3 h-8 w-8"
                aria-label="Voltar às opções"
                onClick={() => setActiveIntentId(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : null}

            <div className={cn('flex flex-col items-center text-center', active && 'pt-2')}>
              <div
                className={cn(
                  'overflow-hidden rounded-full bg-card shadow-md',
                  'ring-2 ring-brand/30 ring-offset-2 ring-offset-background',
                  active ? 'h-16 w-16' : 'h-24 w-24 sm:h-28 sm:w-28',
                )}
              >
                <SafeImage
                  src="/maya/maya-avatar.png"
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <DialogTitle id={titleId} className="mt-3 text-lg font-semibold tracking-tight">
                Maya
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
                {active ? active.title : 'Assistente Teglion'}
              </DialogDescription>
            </div>
          </div>

          <div className="max-h-[min(52dvh,420px)] space-y-4 overflow-y-auto overscroll-y-contain px-5 py-4">
            {!active ? (
              <>
                <div className="flex items-end gap-2.5">
                  <SafeImage
                    src="/maya/maya-avatar-sm.png"
                    alt=""
                    className="mb-0.5 h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-brand/20"
                  />
                  <div
                    className={cn(
                      'min-w-0 flex-1 rounded-2xl rounded-bl-md border border-brand/15',
                      'bg-muted/40 px-3.5 py-3 text-sm leading-relaxed text-foreground',
                      'shadow-sm',
                    )}
                  >
                    <p>
                      Olá{firstName ? `, ${firstName}` : ''}! Eu sou a Maya, a assistente virtual do
                      Teglion.
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      Escolha uma pergunta abaixo — ou use «? Maya» no topo da página para ajuda
                      contextual.
                    </p>
                    <p className="mt-2 text-caption text-muted-foreground">
                      Nesta versão não tenho acesso aos seus documentos nem aos dados privados do
                      escritório.
                    </p>
                  </div>
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
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-end gap-2.5">
                  <SafeImage
                    src="/maya/maya-avatar-sm.png"
                    alt=""
                    className="mb-0.5 h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-brand/20"
                  />
                  <div
                    className={cn(
                      'min-w-0 flex-1 rounded-2xl rounded-bl-md border border-brand/15',
                      'bg-card px-3.5 py-3 text-sm leading-relaxed text-foreground',
                      'shadow-[var(--cb-shadow-card)]',
                    )}
                  >
                    <p>{active.answer}</p>
                    {active.steps.length ? (
                      <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-muted-foreground">
                        {active.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    ) : null}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    closeDialog()
                    navigate(active.deepLink)
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Ir para {active.shortDescription}
                </Button>

                {active.relatedIntents.length ? (
                  <div>
                    <p className="mb-2 text-caption font-medium text-muted-foreground">
                      Outras perguntas
                    </p>
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
        </DialogContent>
      </Dialog>
    </>
  )
}
