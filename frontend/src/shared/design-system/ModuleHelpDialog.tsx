import { useState, type ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { cn } from '@/shared/lib/utils'

export type ModuleHelpStep = {
  title: string
  description: string
}

export type ModuleHelpDialogProps = {
  /** Título do popup — normalmente o nome do módulo. */
  title: string
  /** Frase curta e humana explicando para que serve o módulo. */
  intro: string
  /** Passo a passo de como usar (opcional). */
  steps?: ModuleHelpStep[]
  /** Ação final opcional (ex.: "Começar a enviar documentos"). */
  cta?: { label: string; onClick: () => void }
  /** Texto do botão que abre o popup. */
  triggerLabel?: string
  triggerClassName?: string
  /** Ícone customizado do botão de abertura. */
  triggerIcon?: ReactNode
}

/**
 * Botão "Como funciona?" reutilizável — abre um popup central (não um painel
 * lateral) explicando de forma humana o que o módulo faz e como usar.
 * Reaproveita o Dialog centralizado do design system em vez de introduzir um
 * componente novo de tour/tooltip.
 */
export function ModuleHelpDialog({
  title,
  intro,
  steps,
  cta,
  triggerLabel = 'Como funciona?',
  triggerClassName,
  triggerIcon,
}: ModuleHelpDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn('gap-1.5', triggerClassName)}
        onClick={() => setOpen(true)}
      >
        {triggerIcon ?? <HelpCircle className="h-3.5 w-3.5" />}
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">{intro}</p>
          {steps?.length ? (
            <ol className="space-y-3">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{step.title}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
          {cta ? (
            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  setOpen(false)
                  cta.onClick()
                }}
              >
                {cta.label}
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
